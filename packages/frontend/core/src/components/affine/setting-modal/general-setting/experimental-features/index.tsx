import { Button, Checkbox, Loading, Switch } from '@affine/component';
import { SettingHeader } from '@affine/component/setting-components';
import { useAppSettingHelper } from '@affine/core/hooks/affine/use-app-setting-helper';
import { useAsyncCallback } from '@affine/core/hooks/affine-async-hooks';
import { useI18n } from '@affine/i18n';
import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { Suspense, useCallback, useState } from 'react';

import { ExperimentalFeatureArts } from './arts';
import * as styles from './index.css';

const ExperimentalFeaturesPrompt = ({
  onConfirm,
}: {
  onConfirm: () => void;
}) => {
  const t = useI18n();
  const [checked, setChecked] = useState(false);

  const onChange: (
    event: React.ChangeEvent<HTMLInputElement>,
    checked: boolean
  ) => void = useCallback((_, checked) => {
    setChecked(checked);
  }, []);

  return (
    <div className={styles.promptRoot} data-testid="experimental-prompt">
      <div className={styles.promptTitle}>
        {t[
          'com.affine.settings.workspace.experimental-features.prompt-header'
        ]()}
      </div>
      <div className={styles.promptArt}>
        <ExperimentalFeatureArts />
      </div>
      <div className={styles.promptWarning}>
        <div className={styles.promptWarningTitle}>
          {t[
            'com.affine.settings.workspace.experimental-features.prompt-warning-title'
          ]()}
        </div>
        {t[
          'com.affine.settings.workspace.experimental-features.prompt-warning'
        ]()}
      </div>

      <div className={styles.spacer} />

      <label className={styles.promptDisclaimer}>
        <Checkbox
          checked={checked}
          onChange={onChange}
          data-testid="experimental-prompt-disclaimer"
        />
        {t[
          'com.affine.settings.workspace.experimental-features.prompt-disclaimer'
        ]()}
      </label>

      <div className={styles.promptDisclaimerConfirm}>
        <Button
          disabled={!checked}
          onClick={onConfirm}
          variant="primary"
          data-testid="experimental-confirm-button"
        >
          {t[
            'com.affine.settings.workspace.experimental-features.get-started'
          ]()}
        </Button>
      </div>
    </div>
  );
};

const ExperimentalFeaturesItem = ({
  title,
  isMutating,
  checked,
  onChange,
  testId,
}: {
  title: React.ReactNode;
  isMutating?: boolean;
  checked: boolean;
  onChange: (checked: boolean) => void;
  testId?: string;
}) => {
  return (
    <div className={styles.switchRow}>
      {title}
      <Switch
        checked={checked}
        onChange={onChange}
        className={isMutating ? styles.switchDisabled : ''}
        data-testid={testId}
      />
    </div>
  );
};

const SplitViewSettingRow = () => {
  const { appSettings, updateSettings } = useAppSettingHelper();

  const onToggle = useCallback(
    (checked: boolean) => {
      updateSettings('enableMultiView', checked);
    },
    [updateSettings]
  );

  if (!environment.isDesktop) {
    return null; // only enable on desktop
  }

  return (
    <ExperimentalFeaturesItem
      title="Split View"
      checked={appSettings.enableMultiView}
      onChange={onToggle}
    />
  );
};

const OutlineViewerSettingRow = () => {
  const { appSettings, updateSettings } = useAppSettingHelper();

  const onToggle = useCallback(
    (checked: boolean) => {
      updateSettings('enableOutlineViewer', checked);
    },
    [updateSettings]
  );

  return (
    <ExperimentalFeaturesItem
      title="Outline Viewer"
      checked={appSettings.enableOutlineViewer}
      onChange={onToggle}
      testId="outline-viewer-switch"
    />
  );
};

// feature flag -> display name
const blocksuiteFeatureFlags: Partial<Record<keyof BlockSuiteFlags, string>> = {
  enable_expand_database_block: 'Enable Expand Database Block',
  enable_database_attachment_note: 'Enable Database Attachment Note',
  enable_database_statistics: 'Enable Database Block Statistics',
  enable_block_query: 'Enable Todo Block Query',
};

const BlocksuiteFeatureFlagSettings = () => {
  const { appSettings, updateSettings } = useAppSettingHelper();
  const toggleSetting = useCallback(
    (flag: keyof BlockSuiteFlags, checked: boolean) => {
      updateSettings('editorFlags', {
        ...appSettings.editorFlags,
        [flag]: checked,
      });
    },
    [appSettings.editorFlags, updateSettings]
  );

  type EditorFlag = keyof typeof appSettings.editorFlags;

  return (
    <>
      {Object.entries(blocksuiteFeatureFlags).map(([flag, displayName]) => (
        <ExperimentalFeaturesItem
          key={flag}
          title={'Block Suite: ' + displayName}
          checked={!!appSettings.editorFlags?.[flag as EditorFlag]}
          onChange={checked =>
            toggleSetting(flag as keyof BlockSuiteFlags, checked)
          }
        />
      ))}
    </>
  );
};

const ExperimentalFeaturesMain = () => {
  const t = useI18n();

  return (
    <>
      <SettingHeader
        title={t[
          'com.affine.settings.workspace.experimental-features.header.plugins'
        ]()}
      />
      <div
        className={styles.settingsContainer}
        data-testid="experimental-settings"
      >
        <SplitViewSettingRow />
        <BlocksuiteFeatureFlagSettings />
        <OutlineViewerSettingRow />
      </div>
    </>
  );
};

// TODO(@Peng): save to workspace meta instead?
const experimentalFeaturesDisclaimerAtom = atomWithStorage(
  'affine:experimental-features-disclaimer',
  false
);

export const ExperimentalFeatures = () => {
  const [enabled, setEnabled] = useAtom(experimentalFeaturesDisclaimerAtom);
  const handleConfirm = useAsyncCallback(async () => {
    setEnabled(true);
  }, [setEnabled]);
  if (!enabled) {
    return <ExperimentalFeaturesPrompt onConfirm={handleConfirm} />;
  } else {
    return (
      <Suspense fallback={<Loading />}>
        <ExperimentalFeaturesMain />
      </Suspense>
    );
  }
};
