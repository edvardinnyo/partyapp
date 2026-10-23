import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  isValidPhone,
  normalizeTaxNumber,
  TAX_NUMBER_EXAMPLE,
  taxNumberProblem,
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
import { signOut, signUp } from '@/features/auth/actions';
import { authErrorMessageKey } from '@/features/auth/auth-errors';
import {
  type PartnerApplicationDraft,
  type PendingRegistration,
  useRegistrationStore,
} from '@/features/auth/registration-store';
import { isValidEmail, isValidPassword, PASSWORD_MIN_LENGTH } from '@/features/auth/validation';
import { useAvatarPicker } from '@/features/profile/use-avatar-picker';
import { useUsernameField } from '@/features/profile/use-username-field';
import { api } from '@/lib/api';
import { queryClient, queryKeys } from '@/lib/query-client';
import { useAppTheme } from '@/theme';

import { applicationErrorMessage, sendPartnerApplication } from './send-application';

type PartnerApplicationFormProps =
  /**
   * D-008/22: signed out, the whole application before the email code; the code comes last,
   * and only then is the application sent.
   */
  | { mode: 'signup' }
  /** Signed in without an application yet; `initial` restores what was typed before the code. */
  | {
      mode: 'create';
      initial?: Extract<PendingRegistration, { accountType: 'partner' }> | null;
      initialError?: string | null;
    }
  /** D-008/4: correcting a rejected application; the username and logo stay. */
  | { mode: 'resubmit'; profile: Profile };

function required(value: string) {
  return value.trim().length > 0;
}

// D-008/1–2: the company details the team checks, the public profile, and the acceptances.
export function PartnerApplicationForm(props: PartnerApplicationFormProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const isNew = props.mode !== 'resubmit';
  const draft = props.mode === 'create' ? props.initial?.partner : undefined;
  const previous = props.mode === 'resubmit' ? props.profile.partner : null;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState(
    props.mode === 'resubmit' ? props.profile.displayName : (draft?.displayName ?? ''),
  );
  const [companyName, setCompanyName] = useState(previous?.companyName ?? draft?.companyName ?? '');
  const [taxNumber, setTaxNumber] = useState(previous?.taxNumber ?? draft?.taxNumber ?? '');
  const [taxNumberLeft, setTaxNumberLeft] = useState(false);
  const [contactName, setContactName] = useState(previous?.contactName ?? draft?.contactName ?? '');
  const [contactPhone, setContactPhone] = useState(
    previous?.contactPhone ?? draft?.contactPhone ?? '',
  );
  const [address, setAddress] = useState(previous?.address ?? draft?.address ?? '');
  const [website, setWebsite] = useState(previous?.website ?? draft?.website ?? '');
  const [acceptsTerms, setAcceptsTerms] = useState(draft !== undefined);
  const [acceptsPrivacy, setAcceptsPrivacy] = useState(draft !== undefined);
  const [error, setError] = useState<string | null>(
    props.mode === 'create' ? (props.initialError ?? null) : null,
  );
  const [accountExists, setAccountExists] = useState(false);
  const [saving, setSaving] = useState(false);
  const logo = useAvatarPicker(
    setError,
    props.mode === 'create' ? (props.initial?.logo ?? null) : null,
  );
  const usernameField = useUsernameField(draft?.username ?? '');

  const taxProblem = taxNumberProblem(normalizeTaxNumber(taxNumber));
  // Not while typing: once all 11 digits are there, or after leaving the field.
  const showTaxProblem =
    required(taxNumber) &&
    taxProblem !== null &&
    (taxNumberLeft || taxNumber.replace(/\D/g, '').length >= 11);
  const phoneValid = isValidPhone(contactPhone.trim());
  const websiteValid = !required(website) || websiteSchema.safeParse(website).success;

  const detailsValid =
    displayNameSchema.safeParse(displayName).success &&
    required(companyName) &&
    taxProblem === null &&
    required(contactName) &&
    phoneValid &&
    required(address) &&
    websiteValid;
  const accountValid =
    props.mode !== 'signup' || (isValidEmail(email) && isValidPassword(password));
  const canSubmit =
    detailsValid &&
    accountValid &&
    (!isNew || (usernameField.isAvailable && acceptsTerms && acceptsPrivacy));

  function currentDraft(): PartnerApplicationDraft {
    return {
      displayName: displayName.trim(),
      username: usernameField.username,
      companyName: companyName.trim(),
      taxNumber,
      contactName: contactName.trim(),
      contactPhone: contactPhone.trim(),
      address: address.trim(),
      website: required(website) ? website.trim() : null,
    };
  }

  async function handleSignup() {
    const result = await signUp(email, password, 'partner');
    // Kept either way: after the code, or after signing in to an earlier account with this
    // address, the application is sent without typing it again.
    useRegistrationStore.getState().setPending({
      accountType: 'partner',
      email: email.trim().toLowerCase(),
      password,
      partner: currentDraft(),
      logo: logo.picked,
    });
    if (result === 'accountExists') {
      setError(t('partners.accountExists'));
      setAccountExists(true);
      return;
    }
    router.replace({ pathname: '/verify-email', params: { email: email.trim(), sent: '1' } });
  }

  async function handleSubmit() {
    setError(null);
    setAccountExists(false);
    setSaving(true);
    try {
      if (props.mode === 'signup') {
        await handleSignup();
      } else if (props.mode === 'create') {
        const me = await sendPartnerApplication(currentDraft(), logo.picked);
        useRegistrationStore.getState().clear();
        // The protected routes continue to Home, with the "under review" notice.
        queryClient.setQueryData(queryKeys.me, me);
      } else {
        const { username: _username, ...details } = currentDraft();
        queryClient.setQueryData(queryKeys.me, await api.resubmitPartnerApplication(details));
        router.back();
      }
    } catch (submitError) {
      if (props.mode === 'signup') {
        setError(t(authErrorMessageKey(submitError)));
      } else {
        setError(applicationErrorMessage(submitError, t));
        usernameField.recheck();
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

      {props.mode === 'signup' ? (
        <>
          <AppText variant="muted">{t('partners.registerIntro')}</AppText>
          <AppText variant="muted">{t('partners.codeComesLast')}</AppText>
          <AppText variant="subtitle">{t('auth.signInDetails')}</AppText>
          <TextField
            label={t('partners.businessEmail')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
          />
          <TextField
            label={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            hint={t('auth.passwordHint', { min: PASSWORD_MIN_LENGTH })}
          />
          <AppText variant="subtitle">{t('partners.detailsSection')}</AppText>
        </>
      ) : (
        <AppText variant="muted">{t('partners.applicationIntro')}</AppText>
      )}

      {isNew ? (
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
      {isNew ? (
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
        onBlur={() => setTaxNumberLeft(true)}
        error={
          showTaxProblem
            ? t(
                taxProblem === 'checkDigit'
                  ? 'partners.taxNumberCheckDigit'
                  : 'partners.taxNumberFormat',
                { example: TAX_NUMBER_EXAMPLE },
              )
            : null
        }
        hint={t('partners.taxNumberHint', { example: TAX_NUMBER_EXAMPLE })}
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

      {isNew ? (
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
      {accountExists ? (
        <AppButton
          label={t('auth.signIn')}
          variant="secondary"
          onPress={() => router.dismissTo('/sign-in')}
        />
      ) : null}
      <AppButton
        label={
          props.mode === 'signup'
            ? t('auth.continueToCode')
            : props.mode === 'create'
              ? t('partners.submit')
              : t('partners.resubmit')
        }
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
