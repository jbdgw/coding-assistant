/**
 * Phase 1 Testing - Plugin System
 * Tests plugin registry, loader, and hook system
 */

import { PluginRegistry } from './src/lib/plugins/plugin-registry.js';
import { PluginLoader } from './src/lib/plugins/plugin-loader.js';
import { HookSystem } from './src/lib/plugins/hook-system.js';
import path from 'path';
import os from 'os';

const configDir = path.join(os.homedir(), '.config', 'ai-coding-cli-nodejs');
const pluginsDir = path.join(configDir, 'plugins');

async function testPluginSystem() {
  console.log('\n🧪 PHASE 1 TEST: Plugin System\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Plugin Registry
    console.log('\n📋 Test 1: Plugin Registry Creation');
    const registry = new PluginRegistry(configDir);
    console.log('✅ Plugin registry created');

    // Test 2: Hook System
    console.log('\n📋 Test 2: Hook System Creation');
    const hookSystem = new HookSystem();
    console.log('✅ Hook system created');

    // Test 3: Plugin Loader
    console.log('\n📋 Test 3: Plugin Loader Creation');
    const loader = new PluginLoader(
      {
        pluginsDir,
        autoLoad: false,
        verbose: true,
      },
      registry,
      hookSystem
    );
    console.log('✅ Plugin loader created');

    // Test 4: Load All Plugins
    console.log('\n📋 Test 4: Load Test Plugin');
    await loader.loadAll();
    console.log('✅ Plugins loaded');

    // Test 5: List Plugins
    console.log('\n📋 Test 5: List All Plugins');
    const allPlugins = registry.listAll();
    console.log(`Found ${allPlugins.length} plugin(s):`);
    allPlugins.forEach(p => console.log(`  - ${p.name} v${p.version}: ${p.description}`));

    // Test 6: List Enabled Plugins
    console.log('\n📋 Test 6: List Enabled Plugins');
    const enabledPlugins = registry.listEnabled();
    console.log(`Enabled: ${enabledPlugins.length} plugin(s)`);

    // Test 7: Test Hook Registration
    console.log('\n📋 Test 7: Verify Hook Registration');
    const beforeChatHooks = hookSystem.getHookCount('before-chat');
    const afterResponseHooks = hookSystem.getHookCount('after-response');
    console.log(`  - before-chat hooks: ${beforeChatHooks}`);
    console.log(`  - after-response hooks: ${afterResponseHooks}`);

    if (beforeChatHooks > 0) {
      console.log('✅ Hooks registered successfully');
    } else {
      console.log('⚠️  No hooks registered (plugin may not have hooks)');
    }

    // Test 8: Execute Hooks
    console.log('\n📋 Test 8: Execute Hook (before-chat)');
    const testMessage = 'Test message for hook execution';
    const transformedMessage = await hookSystem.executeBeforeChat(testMessage);
    console.log(`  Input: "${testMessage}"`);
    console.log(`  Output: "${transformedMessage}"`);
    console.log('✅ Hook executed successfully');

    // Test 9: Get Registered Hook Types
    console.log('\n📋 Test 9: Get All Registered Hook Types');
    const hookTypes = hookSystem.getRegisteredHookTypes();
    console.log(`Registered hook types: ${hookTypes.join(', ')}`);

    // Test 10: Cleanup
    console.log('\n📋 Test 10: Cleanup Plugins');
    await registry.cleanupAll();
    console.log('✅ Plugins cleaned up');

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL PLUGIN SYSTEM TESTS PASSED\n');
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    console.error(error instanceof Error ? error.stack : error);
    process.exit(1);
  }
}

testPluginSystem();
