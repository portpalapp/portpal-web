import React from 'react';
import { View, Text, Pressable, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

export interface WorkSlipPickerProps {
  attachments: { uri: string; name: string }[];
  onSetAttachments: (attachments: { uri: string; name: string }[]) => void;
}

export default React.memo(function WorkSlipPicker({
  attachments,
  onSetAttachments,
}: WorkSlipPickerProps) {
  return (
    <View className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
      <Text className="text-xs font-medium text-slate-500 mb-3">Work Slips</Text>
      <View className="flex-row gap-3">
        {[0, 1, 2].map((slot) => {
          const file = attachments[slot];
          return (
            <Pressable
              key={slot}
              onPress={async () => {
                if (file) {
                  onSetAttachments(attachments.filter((_, i) => i !== slot));
                  return;
                }
                try {
                  const result = await DocumentPicker.getDocumentAsync({
                    type: ['image/*', 'application/pdf'],
                    copyToCacheDirectory: true,
                    multiple: true,
                  });
                  if (!result.canceled && result.assets.length > 0) {
                    const newFiles = result.assets.map((a) => ({ uri: a.uri, name: a.name }));
                    onSetAttachments([...attachments, ...newFiles].slice(0, 3));
                  }
                } catch {
                  Alert.alert('Error', 'Could not select file.');
                }
              }}
              className={`flex-1 aspect-square ${
                file ? 'bg-green-50 border-green-300' : 'bg-slate-50 border-slate-300'
              } border-2 border-dashed rounded-xl items-center justify-center`}
            >
              {file ? (
                /\.(jpg|jpeg|png|heic)$/i.test(file.name) ? (
                  <View className="w-full h-full rounded-xl overflow-hidden">
                    <Image
                      source={{ uri: file.uri }}
                      resizeMode="cover"
                      className="w-full h-full rounded-xl"
                    />
                    <View className="absolute bottom-0 left-0 right-0 bg-black/50 py-1 rounded-b-xl">
                      <Text className="text-[9px] text-white text-center">Tap to remove</Text>
                    </View>
                  </View>
                ) : (
                  <>
                    <Ionicons name="document-attach" size={22} color="#16a34a" />
                    <Text
                      className="text-[9px] text-green-700 mt-1 px-1 text-center"
                      numberOfLines={1}
                    >
                      {file.name}
                    </Text>
                    <Text className="text-[9px] text-slate-400">Tap to remove</Text>
                  </>
                )
              ) : (
                <>
                  <Ionicons name="camera-outline" size={24} color="#94a3b8" />
                  <Text className="text-[10px] text-slate-400 mt-1">Add File</Text>
                </>
              )}
            </Pressable>
          );
        })}
      </View>
      <Text className="text-[10px] text-slate-400 mt-2 text-center">
        Attach photos or PDFs of work slips
      </Text>
    </View>
  );
});
