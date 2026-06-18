import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { AlertCircle, X } from 'lucide-react-native';
import { clearRuntimeIssues, getRuntimeIssues, RuntimeIssue } from '../lib/runtimeDiagnostics';

const StartupIssueBanner: React.FC = () => {
  const [issue, setIssue] = useState<RuntimeIssue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    getRuntimeIssues()
      .then((issues) => {
        if (mounted) {
          setIssue(issues[0] || null);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleClear = async () => {
    await clearRuntimeIssues();
    setIssue(null);
  };

  if (loading || !issue) {
    return null;
  }

  return (
    <View className="absolute left-4 right-4 top-12 z-[999]">
      <View className="rounded-2xl border border-[#FE2C55]/40 bg-zinc-950/95 p-4 shadow-2xl">
        <View className="flex-row items-start">
          <View className="mr-3 rounded-full bg-[#FE2C55]/15 p-2">
            <AlertCircle color="#FE2C55" size={18} />
          </View>
          <View className="flex-1 pr-2">
            <Text className="text-white text-sm font-bold" numberOfLines={1}>
              Dernier crash capturé
            </Text>
            <Text className="text-zinc-400 text-xs mt-1" numberOfLines={2}>
              {issue.message}
            </Text>
          </View>
          <TouchableOpacity onPress={handleClear} className="p-1">
            <X color="#52525b" size={16} />
          </TouchableOpacity>
        </View>
        <Text className="text-zinc-500 text-[10px] mt-3">
          {issue.source} - {new Date(issue.timestamp).toLocaleString()}
        </Text>
      </View>
    </View>
  );
};

export default StartupIssueBanner;
