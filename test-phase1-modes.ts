/**
 * Phase 1 Testing - Mode Manager
 * Tests mode manager and mode presets
 */

import { ModeManager } from './src/lib/modes/mode-manager.js';
import { MODE_PRESETS, listModes, getModeConfig, getModeDescriptions } from './src/config/mode-presets.js';
import { ConfigStore } from './src/utils/storage.js';
import { AgentMode } from './src/types/mode.js';

async function testModeManager() {
  console.log('\n🧪 PHASE 1 TEST: Mode Manager\n');
  console.log('='.repeat(60));

  try {
    // Test 1: ConfigStore Creation
    console.log('\n📋 Test 1: Create ConfigStore');
    const configStore = new ConfigStore();
    console.log('✅ ConfigStore created');

    // Test 2: ModeManager Creation
    console.log('\n📋 Test 2: Create ModeManager');
    const modeManager = new ModeManager(configStore);
    console.log('✅ ModeManager created');

    // Test 3: Get Current Mode (should be default)
    console.log('\n📋 Test 3: Get Current Mode');
    const currentMode = modeManager.getCurrentMode();
    console.log(`  Current mode: ${currentMode.name}`);
    console.log(`  Model: ${currentMode.model}`);
    console.log(`  Max steps: ${currentMode.maxSteps}`);
    console.log(`  Verbosity: ${currentMode.verbosity}`);
    console.log('✅ Current mode retrieved');

    // Test 4: List All Mode Names
    console.log('\n📋 Test 4: List All Mode Names');
    const modeNames = modeManager.listModeNames();
    console.log(`  Available modes (${modeNames.length}): ${modeNames.join(', ')}`);

    if (modeNames.length === 5) {
      console.log('✅ All 5 preset modes available');
    } else {
      throw new Error(`Expected 5 modes, found ${modeNames.length}`);
    }

    // Test 5: Verify All Presets
    console.log('\n📋 Test 5: Verify All Mode Presets');
    const expectedModes = ['quick-fix', 'deep-dive', 'learning', 'review', 'default'];
    for (const modeName of expectedModes) {
      const config = getModeConfig(modeName);
      if (config) {
        console.log(`  ✓ ${modeName}: ${config.model} (${config.maxSteps} steps)`);
      } else {
        throw new Error(`Mode ${modeName} not found`);
      }
    }
    console.log('✅ All presets verified');

    // Test 6: Set Mode to Quick-Fix
    console.log('\n📋 Test 6: Switch to Quick-Fix Mode');
    modeManager.setMode('quick-fix');
    const quickFixMode = modeManager.getCurrentMode();
    console.log(`  Switched to: ${quickFixMode.name}`);
    console.log(`  Model: ${quickFixMode.model}`);
    console.log(`  Max steps: ${quickFixMode.maxSteps}`);
    console.log(`  Auto-apply: ${quickFixMode.autoApply}`);

    if (quickFixMode.name === 'quick-fix' && quickFixMode.model === 'openai/gpt-4o-mini') {
      console.log('✅ Mode switched successfully');
    } else {
      throw new Error('Mode switch failed');
    }

    // Test 7: Set Mode to Deep-Dive
    console.log('\n📋 Test 7: Switch to Deep-Dive Mode');
    modeManager.setMode('deep-dive');
    const deepDiveMode = modeManager.getCurrentMode();
    console.log(`  Switched to: ${deepDiveMode.name}`);
    console.log(`  Model: ${deepDiveMode.model}`);
    console.log(`  Max steps: ${deepDiveMode.maxSteps}`);

    if (deepDiveMode.name === 'deep-dive' && deepDiveMode.maxSteps === 20) {
      console.log('✅ Deep-dive mode verified');
    } else {
      throw new Error('Deep-dive mode incorrect');
    }

    // Test 8: Create Custom Mode
    console.log('\n📋 Test 8: Create Custom Mode');
    modeManager.setCustomMode('test-mode', {
      name: 'test-mode',
      description: 'Test custom mode',
      model: 'anthropic/claude-3.5-haiku',
      maxSteps: 5,
      verbosity: 'low',
      autoApply: true,
      budgetLimit: 0.05,
    });
    console.log('✅ Custom mode created');

    // Test 9: Get Custom Modes
    console.log('\n📋 Test 9: Get Custom Modes');
    const customModes = modeManager.getCustomModes();
    console.log(`  Custom modes count: ${Object.keys(customModes).length}`);
    if (customModes['test-mode']) {
      console.log(`  ✓ test-mode: ${customModes['test-mode'].model}`);
      console.log('✅ Custom mode retrieved');
    } else {
      throw new Error('Custom mode not found');
    }

    // Test 10: Apply Mode to Options
    console.log('\n📋 Test 10: Apply Mode to Options');
    modeManager.setMode('quick-fix');
    const baseOptions = { verbose: true };
    const optionsWithMode = modeManager.applyModeToOptions(baseOptions);
    console.log(`  Base options: ${JSON.stringify(baseOptions)}`);
    console.log(`  With mode: model=${optionsWithMode.model}, maxSteps=${optionsWithMode.maxSteps}`);

    if (optionsWithMode.model && optionsWithMode.maxSteps) {
      console.log('✅ Mode applied to options');
    } else {
      throw new Error('Failed to apply mode to options');
    }

    // Test 11: Get Mode Info String
    console.log('\n📋 Test 11: Get Mode Info String');
    const modeInfo = modeManager.getModeInfo();
    console.log(`  Mode info: ${modeInfo}`);
    console.log('✅ Mode info string generated');

    // Test 12: Delete Custom Mode
    console.log('\n📋 Test 12: Delete Custom Mode');
    modeManager.deleteCustomMode('test-mode');
    const remainingCustomModes = modeManager.getCustomModes();

    if (!remainingCustomModes['test-mode']) {
      console.log('✅ Custom mode deleted');
    } else {
      throw new Error('Custom mode deletion failed');
    }

    // Test 13: Mode Descriptions
    console.log('\n📋 Test 13: Get Mode Descriptions');
    const descriptions = getModeDescriptions();
    console.log('  Mode descriptions:');
    console.log(
      descriptions
        .split('\n')
        .map(line => '  ' + line)
        .join('\n')
    );
    console.log('✅ Mode descriptions generated');

    // Test 14: List All Modes (full configs)
    console.log('\n📋 Test 14: List All Mode Configurations');
    const allModes = modeManager.listModes();
    console.log(`  Total configurations: ${allModes.length}`);
    console.log('✅ All mode configurations listed');

    // Test 15: Check Mode Existence
    console.log('\n📋 Test 15: Check Mode Existence');
    const hasQuickFix = modeManager.hasMode('quick-fix');
    const hasInvalid = modeManager.hasMode('invalid-mode');
    console.log(`  hasMode('quick-fix'): ${hasQuickFix}`);
    console.log(`  hasMode('invalid-mode'): ${hasInvalid}`);

    if (hasQuickFix && !hasInvalid) {
      console.log('✅ Mode existence check works');
    } else {
      throw new Error('Mode existence check failed');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL MODE MANAGER TESTS PASSED\n');
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    console.error(error instanceof Error ? error.stack : error);
    process.exit(1);
  }
}

testModeManager();
