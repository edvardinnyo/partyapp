import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  isValidPhone,
  isValidTaxNumber,
  normalizeTaxNumber,
  websiteSchema,
} from '@shared/contracts/partner';
import {
  displayNameSchema,
  DISPLAY_NAME_MAX_LENGTH,
  type Profile,
  USERNAME_MAX_LENGTH,
} from '@shared/contracts/profile';
import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import { Avatar } from '@/components/avatar';
import { Checkbox } from '@/components/checkbox';
import { FormMessage } from '@/components/form-message';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { signOut } from '@/features/auth/actions';
import { uploadAvatar } from '@/features/profile/avatar-upload';
import { useAvatarPicker } from '@/features/profile/use-avatar-picker';
import { useUsernameField } from '@/features/profile/use-username-field';
import { api, ApiError } from '@/lib/api';
import { queryClient, queryKeys } from '@/lib/query-client';
import { useAppTheme } from '@/theme';

class LogoUploadError extends Error {}

type PartnerApplicationFormProps =
  /** The first application, right after the email is confirmed. */
  | { mode: 'create' }
  /** D-008/4: correcting a rejected application; the username and logo stay. */
  | { mode: 'resubmit'; profile: Profile };

function required(value: string) {
  return value.trim().length > 0;
}

// D-008/1–2: the company details the team checks, the public profile, and the acceptances.
export function PartnerApplicationForm(props: PartnerApplicationFormProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const previous = props.mode === 'resubmit' ? props.profile.partner : null;
  const [displayName, setDisplayName] = useState(
    props.mode === 'resubmit' ? props.profile.displayName : '',
  );
  const [companyName, setCompanyName] = useState(previous?.companyName ?? '');
  const [taxNumber, setTaxNumber] = useState(previous?.taxNumber ?? '');
  const [contactName, setContactName] = useState(previous?.contactName ?? '');
  const [contactPhone, setContactPhone] = useState(previous?.contactPhone ?? '');
  const [address, setAddress] = useState(previous?.address ?? '');
  const [website, setWebsite] = useState(previous?.website ?? '');
  const [acceptsTerms, setAcceptsTerms] = useState(false);
  const [acceptsPrivacy, setAcceptsPrivacy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const logo = useAvatarPicker(setError);
  const usernameField = useUsernameField();

  const taxNumberValid = isValidTaxNumber(normalizeTaxNumber(taxNumber));
  const phoneValid = isValidPhone(contactPhone.trim());
  const websiteValid = !required(website) || websiteSchema.safeParse(website).success;

  const detailsValid =
    displayNameSchema.safeParse(displayName).success &&
    required(companyName) &&
    taxNumberValid &&
    required(contactName) &&
    phoneValid &&
    required(address) &&
    websiteValid;
  const canSubmit =
    detailsValid &&
    (props.mode === 'resubmit' || (usernameField.isAvailable && acceptsTerms && acceptsPrivacy));

  async function handleSubmit() {
    setError(null);
    setSaving(true);
    const details = {
      displayName: displayName.trim(),
      companyName: companyName.trim(),
      taxNumber,
      contactName: contactName.trim(),
      contactPhone: contactPhone.trim(),
      address: address.trim(),
      website: required(website) ? website.trim() : null,
    };
    try {
      if (props.mode === 'create') {
        const avatarPath = logo.picked
          ? await uploadAvatar(logo.picked).catch(() => {
              throw new LogoUploadError();
            })
          : null;
        const me = await api.submitPartnerApplication({
          ...details,
          username: usernameField.username,
          avatarPath,
          termsAccepted: true,
          privacyAccepted: true,
        });
        // The protected routes continue to Home, with the "under review" notice.
        queryClient.setQueryData(queryKeys.me, me);
      } else {
        queryClient.setQueryData(queryKeys.me, await api.resubmitPartnerApplication(details));
        router.back();
      }
    } catch (submitError) {
      const code = submitError instanceof ApiError ? submitError.code : null;
      if (code === 'username_taken') {
        setError(t('onboarding.usernameTaken'));
        usernameField.recheck();
      } else if (code === 'name_protected') {
        setError(t('partners.nameProtected'));
      } else if (submitError instanceof LogoUploadError || code === 'invalid_avatar') {
        setError(t('onboarding.avatarUploadFailed'));
      } else if (code === 'network') {
        setError(t('common.networkError'));
      } else {
        setError(t('common.genericError'));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen edges={['bottom']}>
      {previous?.rejectionReason ? (
        <View
          style={[styles.notice, { backgroundColor: colors.surface, borderColor: colors.danger }]}
        >
          <AppText>{t('partners.rejectedReason', { reason: previous.rejectionReason })}</AppText>
        </View>
      ) : null}
      <AppText variant="muted">{t('partners.applicationIntro')}</AppText>

      {props.mode === 'create' ? (
        <View style={styles.logo}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('partners.logo')}
            onPress={logo.choose}
          >
            <Avatar uri={logo.picked?.uri} size={112} />
          </Pressable>
          <AppText variant="muted">{t('partners.logo')}</AppText>
          {logo.picked ? (
            <AppButton label={t('partners.logoRemove')} variant="link" onPress={logo.clear} />
          ) : null}
        </View>
      ) : null}

      <TextField
        label={t('partners.publicName')}
        value={displayName}
        onChangeText={setDisplayName}
        maxLength={DISPLAY_NAME_MAX_LENGTH}
        hint={t('partners.publicNameHint')}
      />
      {props.mode === 'create' ? (
        <TextField
          label={t('onboarding.username')}
          value={usernameField.input}
          onChangeText={usernameField.setInput}
          maxLength={USERNAME_MAX_LENGTH}
          autoCapitalize="none"
          autoCorrect={false}
          error={usernameField.error}
          hint={usernameField.hint}
          hintTone={usernameField.hintTone}
        />
      ) : null}
      <TextField
        label={t('partners.companyName')}
        value={companyName}
        onChangeText={setCompanyName}
        maxLength={200}
        hint={t('partners.companyNameHint')}
      />
      <TextField
        label={t('partners.taxNumber')}
        value={taxNumber}
        onChangeText={setTaxNumber}
        maxLength={20}
        keyboardType="numbers-and-punctuation"
        error={required(taxNumber) && !taxNumberValid ? t('partners.taxNumberInvalid') : null}
        hint={t('partners.taxNumberHint')}
      />
      <TextField
        label={t('partners.contactName')}
        value={contactName}
        onChangeText={setContactName}
        maxLength={100}
        autoComplete="name"
        textContentType="name"
      />
      <TextField
        label={t('partners.contactPhone')}
        value={contactPhone}
        onChangeText={setContactPhone}
        maxLength={30}
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        error={required(contactPhone) && !phoneValid ? t('partners.phoneInvalid') : null}
      />
      <TextField
        label={t('partners.address')}
        value={address}
        onChangeText={setAddress}
        maxLength={300}
        textContentType="fullStreetAddress"
      />
      <TextField
        label={t('partners.website')}
        value={website}
        onChangeText={setWebsite}
        maxLength={300}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        error={websiteValid ? null : t('partners.websiteInvalid')}
      />

      {props.mode === 'create' ? (
        <>
          <Checkbox
            label={t('partners.termsAccept')}
            checked={acceptsTerms}
            onChange={setAcceptsTerms}
          />
          <Checkbox
            label={t('onboarding.privacyAccept')}
            checked={acceptsPrivacy}
            onChange={setAcceptsPrivacy}
          />
          <View style={styles.links}>
            <AppButton
              label={t('partners.termsTitle')}
              variant="link"
              onPress={() => router.push('/partner-terms')}
            />
            <AppButton
              label={t('auth.privacyLink')}
              variant="link"
              onPress={() => router.push('/privacy')}
            />
          </View>
        </>
      ) : null}

      <FormMessage message={error} />
      <AppButton
        label={props.mode === 'create' ? t('partners.submit') : t('partners.resubmit')}
        onPress={handleSubmit}
        loading={saving}
        disabled={saving || !canSubmit}
      />
      {props.mode === 'create' ? (
        <AppButton label={t('settings.signOut')} variant="link" onPress={() => void signOut()} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  notice: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  logo: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  links: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
});
