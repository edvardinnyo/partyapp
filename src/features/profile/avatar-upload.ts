import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';

const AVATAR_WIDTH_PX = 512;

export type PickedAvatar = {
  uri: string;
  base64: string;
};

/** Lets the user pick or take a square photo, then shrinks it to a small JPEG. */
export async function pickAvatar(
  source: 'library' | 'camera',
): Promise<PickedAvatar | 'cancelled' | 'permissionDenied'> {
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  };

  let result: ImagePicker.ImagePickerResult;
  if (source === 'camera') {
    // Asked only when the user first wants to take a photo (CLAUDE.md, chapter 10).
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      return 'permissionDenied';
    }
    result = await ImagePicker.launchCameraAsync(options);
  } else {
    result = await ImagePicker.launchImageLibraryAsync(options);
  }

  const asset = result.canceled ? undefined : result.assets[0];
  if (!asset) {
    return 'cancelled';
  }

  const image = await ImageManipulator.manipulate(asset.uri)
    .resize({ width: AVATAR_WIDTH_PX })
    .renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8, base64: true });
  if (!saved.base64) {
    throw new Error('The resized image has no data');
  }
  return { uri: saved.uri, base64: saved.base64 };
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

/** Uploads into the user's own folder of the private `avatars` bucket and returns the path. */
export async function uploadAvatar(avatar: PickedAvatar): Promise<string> {
  const { path, token } = await api.createAvatarUpload();
  const { error } = await supabase.storage
    .from('avatars')
    .uploadToSignedUrl(path, token, base64ToBytes(avatar.base64), { contentType: 'image/jpeg' });
  if (error) {
    throw error;
  }
  return path;
}
