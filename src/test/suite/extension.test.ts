import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('genesisdb.genesisdb-vscode'));
    });

    test('Should activate extension', async () => {
        const extension = vscode.extensions.getExtension('genesisdb.genesisdb-vscode');
        assert.ok(extension);
        await extension!.activate();
        assert.strictEqual(extension!.isActive, true);
    });

    test('Should register all commands', async () => {
        const extension = vscode.extensions.getExtension('genesisdb.genesisdb-vscode');
        await extension!.activate();

        const commands = await vscode.commands.getCommands(true);
        const genesisCommands = commands.filter(cmd => cmd.startsWith('genesisdb.'));

        // Verify main commands are registered
        assert.ok(genesisCommands.includes('genesisdb.addConnection'));
    });
});
