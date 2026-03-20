import React from 'react';
import { View, Text, Pressable, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { TemplateRecord } from '../../hooks/useTemplates';
import { DIFFERENTIALS } from '../../data/mockData';
import { formatDateMedium } from '../../lib/formatters';
import type { LastShiftData, ShiftType } from './types';

// Sorted jobs list (alphabetical) — computed once at module level
import { JOBS } from '../../data/mockData';
const SORTED_JOBS = [...JOBS].sort();

// ─── Callback Card ───

interface CallbackCardProps {
  lastShift: LastShiftData;
  onRepeat: () => void;
  onEdit: () => void;
  onNewShift: () => void;
}

const CallbackCard = React.memo(function CallbackCard({
  lastShift,
  onRepeat,
  onEdit,
  onNewShift,
}: CallbackCardProps) {
  return (
    <View className="bg-white rounded-2xl p-4 mb-4 border border-green-200 shadow-sm">
      <View className="flex-row items-center gap-2 mb-2">
        <View className="p-1.5 bg-green-100 rounded-lg">
          <Ionicons name="repeat" size={16} color="#16a34a" />
        </View>
        <Text className="font-semibold text-slate-700">
          Same as {formatDateMedium(lastShift.date)}?
        </Text>
      </View>
      <View className="flex-row items-center gap-2 mb-3 ml-1">
        <Text className="text-slate-800 font-medium">{lastShift.job}</Text>
        <Text className="text-slate-400">{'\u2022'}</Text>
        <Text className="text-slate-600">{lastShift.location}</Text>
        <View
          className={`px-1.5 py-0.5 rounded ${
            lastShift.shift === 'DAY'
              ? 'bg-amber-100'
              : lastShift.shift === 'NIGHT'
              ? 'bg-blue-100'
              : 'bg-purple-100'
          }`}
        >
          <Text
            className={`text-[10px] font-medium ${
              lastShift.shift === 'DAY'
                ? 'text-amber-700'
                : lastShift.shift === 'NIGHT'
                ? 'text-blue-700'
                : 'text-purple-700'
            }`}
          >
            {lastShift.shift}
          </Text>
        </View>
      </View>
      <View className="flex-row gap-2">
        <Pressable
          onPress={onRepeat}
          className="flex-1 py-3.5 bg-green-600 rounded-xl flex-row items-center justify-center gap-2"
        >
          <Ionicons name="checkmark-circle" size={20} color="white" />
          <Text className="text-white font-semibold text-base">Yes, log it</Text>
        </Pressable>
        <Pressable
          onPress={onEdit}
          className="flex-1 py-3.5 bg-slate-100 rounded-xl items-center justify-center"
        >
          <Text className="text-slate-600 font-medium">Edit first</Text>
        </Pressable>
      </View>
      <Pressable onPress={onNewShift} className="items-center mt-3">
        <Text className="text-slate-400 text-sm">New shift instead</Text>
      </Pressable>
    </View>
  );
});

// ─── Choose Mode (Template / New Shift buttons) ───

interface ChooseModeProps {
  templateCount: number;
  onChooseTemplates: () => void;
  onChooseNewShift: () => void;
}

const ChooseMode = React.memo(function ChooseMode({
  templateCount,
  onChooseTemplates,
  onChooseNewShift,
}: ChooseModeProps) {
  return (
    <View style={{ minHeight: Dimensions.get('window').height - 300, justifyContent: 'flex-end' }}>
      <View className="flex-row gap-3 mb-5">
        <Pressable
          onPress={onChooseTemplates}
          className="flex-1 py-5 bg-purple-600 rounded-2xl items-center justify-center"
        >
          <Ionicons name="star" size={28} color="white" />
          <Text className="text-white font-semibold mt-2 text-base">Use Template</Text>
          {templateCount > 0 && (
            <Text className="text-purple-200 text-xs mt-1">{templateCount} saved</Text>
          )}
        </Pressable>
        <Pressable
          onPress={onChooseNewShift}
          className="flex-1 py-5 bg-blue-600 rounded-2xl items-center justify-center"
        >
          <Ionicons name="add-circle" size={28} color="white" />
          <Text className="text-white font-semibold mt-2 text-base">New Shift</Text>
          <Text className="text-blue-200 text-xs mt-1">Pick a job</Text>
        </Pressable>
      </View>
    </View>
  );
});

// ─── Template List ───

interface TemplateListProps {
  templates: TemplateRecord[];
  onApply: (template: TemplateRecord) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

const TemplateList = React.memo(function TemplateList({
  templates,
  onApply,
  onDelete,
  onBack,
}: TemplateListProps) {
  return (
    <View>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="font-semibold text-slate-700">Your Templates</Text>
        <Pressable
          onPress={onBack}
          className="flex-row items-center gap-1 px-3 py-1.5 bg-slate-100 rounded-lg"
        >
          <Ionicons name="arrow-back" size={14} color="#475569" />
          <Text className="text-slate-600 text-sm">Back</Text>
        </Pressable>
      </View>

      {templates.map((template) => (
        <View
          key={template.id}
          className="bg-white rounded-xl border border-slate-200 p-4 mb-3 flex-row items-center"
        >
          <View className="flex-1">
            <Text className="font-semibold text-slate-800 text-base mb-1">{template.name}</Text>
            <View className="flex-row items-center gap-2 flex-wrap">
              <View className="flex-row items-center gap-1">
                <Ionicons name="briefcase-outline" size={12} color="#64748b" />
                <Text className="text-xs text-slate-500">{template.job}</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Ionicons name="location-outline" size={12} color="#64748b" />
                <Text className="text-xs text-slate-500">{template.location}</Text>
              </View>
              <View
                className={`px-1.5 py-0.5 rounded ${
                  template.shift === 'DAY'
                    ? 'bg-amber-100'
                    : template.shift === 'NIGHT'
                    ? 'bg-blue-100'
                    : 'bg-purple-100'
                }`}
              >
                <Text
                  className={`text-[10px] font-medium ${
                    template.shift === 'DAY'
                      ? 'text-amber-700'
                      : template.shift === 'NIGHT'
                      ? 'text-blue-700'
                      : 'text-purple-700'
                  }`}
                >
                  {template.shift}
                </Text>
              </View>
            </View>
          </View>
          <Pressable
            onPress={() => onApply(template)}
            className="px-4 py-2 bg-purple-600 rounded-lg ml-3"
          >
            <Text className="text-white text-sm font-medium">Use</Text>
          </Pressable>
          <Pressable onPress={() => onDelete(template.id)} className="p-2 ml-1">
            <Ionicons name="trash-outline" size={16} color="#f87171" />
          </Pressable>
        </View>
      ))}

      {templates.length === 0 && (
        <View className="items-center py-8">
          <Ionicons name="star-outline" size={32} color="#cbd5e1" />
          <Text className="text-slate-400 text-sm mt-2">No templates saved yet</Text>
        </View>
      )}
    </View>
  );
});

// ─── Job Grid ───

interface JobGridProps {
  selectedJob: string;
  onSelectJob: (job: string) => void;
  onBack: () => void;
}

const JobGrid = React.memo(function JobGrid({ selectedJob, onSelectJob, onBack }: JobGridProps) {
  return (
    <View>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="font-semibold text-slate-700">What job did you work?</Text>
        <Pressable
          onPress={onBack}
          className="flex-row items-center gap-1 px-3 py-1.5 bg-slate-100 rounded-lg"
        >
          <Ionicons name="arrow-back" size={14} color="#475569" />
          <Text className="text-slate-600 text-sm">Back</Text>
        </Pressable>
      </View>

      {/* Job Grid - no maxHeight, scrolls with page */}
      <View className="flex-row flex-wrap gap-2">
        {SORTED_JOBS.map((j) => {
          const diff = DIFFERENTIALS[j];
          const hasData = diff?.hasData ?? false;

          return (
            <Pressable
              key={j}
              onPress={() => onSelectJob(j)}
              className={`w-[48%] p-3 rounded-xl relative ${
                selectedJob === j ? 'bg-blue-600' : 'bg-white border border-slate-200'
              }`}
            >
              <Text
                className={`text-sm font-medium pr-5 ${
                  selectedJob === j ? 'text-white' : 'text-slate-700'
                }`}
              >
                {j}
              </Text>
              <View className="absolute top-2 right-2">
                {hasData ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color={selectedJob === j ? '#86efac' : '#22c55e'}
                  />
                ) : (
                  <Ionicons
                    name="alert-circle-outline"
                    size={14}
                    color={selectedJob === j ? '#fdba74' : '#fb923c'}
                  />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Legend */}
      <View className="flex-row gap-4 mt-3 mb-4">
        <View className="flex-row items-center gap-1">
          <Ionicons name="checkmark-circle" size={12} color="#22c55e" />
          <Text className="text-xs text-slate-500">Verified rate</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Ionicons name="alert-circle-outline" size={12} color="#fb923c" />
          <Text className="text-xs text-slate-500">Base rate (learning)</Text>
        </View>
      </View>
    </View>
  );
});

// ─── Main Step 1 Component ───

export interface ShiftFormStep1Props {
  step1Mode: 'choose' | 'templates' | 'jobs';
  lastShift: LastShiftData | null;
  selectedJob: string;
  templates: TemplateRecord[];
  onSetStep1Mode: (mode: 'choose' | 'templates' | 'jobs') => void;
  onRepeatLastShift: () => void;
  onEditLastShift: () => void;
  onSelectJob: (job: string) => void;
  onApplyTemplate: (template: TemplateRecord) => void;
  onDeleteTemplate: (id: string) => void;
}

export default React.memo(function ShiftFormStep1({
  step1Mode,
  lastShift,
  selectedJob,
  templates,
  onSetStep1Mode,
  onRepeatLastShift,
  onEditLastShift,
  onSelectJob,
  onApplyTemplate,
  onDeleteTemplate,
}: ShiftFormStep1Props) {
  return (
    <View>
      {/* Prominent Callback Card */}
      {lastShift && step1Mode === 'choose' && (
        <CallbackCard
          lastShift={lastShift}
          onRepeat={onRepeatLastShift}
          onEdit={onEditLastShift}
          onNewShift={() => onSetStep1Mode('jobs')}
        />
      )}

      {/* Two big buttons: Use Template / New Shift */}
      {step1Mode === 'choose' && (
        <ChooseMode
          templateCount={templates.length}
          onChooseTemplates={() => {
            if (templates.length > 0) {
              onSetStep1Mode('templates');
            } else {
              Alert.alert('No Templates', 'Save a template from the review step to use it here.');
            }
          }}
          onChooseNewShift={() => onSetStep1Mode('jobs')}
        />
      )}

      {/* Templates List */}
      {step1Mode === 'templates' && (
        <TemplateList
          templates={templates}
          onApply={onApplyTemplate}
          onDelete={onDeleteTemplate}
          onBack={() => onSetStep1Mode('choose')}
        />
      )}

      {/* Job Selection List */}
      {step1Mode === 'jobs' && (
        <JobGrid
          selectedJob={selectedJob}
          onSelectJob={onSelectJob}
          onBack={() => onSetStep1Mode('choose')}
        />
      )}
    </View>
  );
});
