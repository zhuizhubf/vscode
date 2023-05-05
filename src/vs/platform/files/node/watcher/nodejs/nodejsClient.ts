/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IDiskFileChange, AbstractNonRecursiveWatcherClient, INonRecursiveWatcher, IWatcherClientLoggerConfiguration } from 'vs/platform/files/common/watcher';
import { NodeJSWatcher } from 'vs/platform/files/node/watcher/nodejs/nodejsWatcher';

export class NodeJSWatcherClient extends AbstractNonRecursiveWatcherClient {

	constructor(
		onFileChanges: (changes: IDiskFileChange[]) => void,
		loggerConfiguration: IWatcherClientLoggerConfiguration
	) {
		super(onFileChanges, loggerConfiguration);

		this.init();
	}

	protected override createWatcher(): INonRecursiveWatcher {
		return new NodeJSWatcher();
	}
}
