/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { IExtHostConsumerFileSystem } from 'vs/workbench/api/common/extHostFileSystemConsumer';
import { Schemas } from 'vs/base/common/network';
import { ILogService } from 'vs/platform/log/common/log';
import { DiskFileSystemProvider } from 'vs/platform/files/node/diskFileSystemProvider';
import { IExtHostInitDataService } from 'vs/workbench/api/common/extHostInitDataService';

export class ExtHostDiskFileSystemProvider {

	constructor(
		@IExtHostInitDataService initData: IExtHostInitDataService,
		@IExtHostConsumerFileSystem extHostConsumerFileSystem: IExtHostConsumerFileSystem,
		@ILogService logService: ILogService
	) {

		// Register disk file system provider so that certain
		// file operations can execute fast within the extension
		// host without roundtripping.
		extHostConsumerFileSystem.addFileSystemProvider(Schemas.file, new DiskFileSystemProviderAdapter(initData, logService));
	}
}

class DiskFileSystemProviderAdapter implements vscode.FileSystemProvider {

	private readonly _impl = new DiskFileSystemProvider(this._logService, { logsHome: this._initData.logsLocation });

	constructor(
		private readonly _initData: IExtHostInitDataService,
		private readonly _logService: ILogService
	) { }

	stat(uri: vscode.Uri): Promise<vscode.FileStat> {
		return this._impl.stat(uri);
	}

	readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
		return this._impl.readdir(uri);
	}

	createDirectory(uri: vscode.Uri): Promise<void> {
		return this._impl.mkdir(uri);
	}

	readFile(uri: vscode.Uri): Promise<Uint8Array> {
		return this._impl.readFile(uri);
	}

	writeFile(uri: vscode.Uri, content: Uint8Array, options: { readonly create: boolean; readonly overwrite: boolean }): Promise<void> {
		return this._impl.writeFile(uri, content, { ...options, unlock: false });
	}

	delete(uri: vscode.Uri, options: { readonly recursive: boolean }): Promise<void> {
		return this._impl.delete(uri, { ...options, useTrash: false });
	}

	rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { readonly overwrite: boolean }): Promise<void> {
		return this._impl.rename(oldUri, newUri, options);
	}

	copy(source: vscode.Uri, destination: vscode.Uri, options: { readonly overwrite: boolean }): Promise<void> {
		return this._impl.copy(source, destination, options);
	}

	// --- Not Implemented ---

	get onDidChangeFile(): never { throw new Error('Method not implemented.'); }
	watch(uri: vscode.Uri, options: { readonly recursive: boolean; readonly excludes: readonly string[] }): vscode.Disposable { throw new Error('Method not implemented.'); }
}
