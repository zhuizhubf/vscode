/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from 'vs/nls';
import { Disposable } from 'vs/base/common/lifecycle';
import { ILogMessage, INonRecursiveWatchRequest, IRecursiveWatchRequest, IUniversalWatcher, IUniversalWatchRequest } from 'vs/platform/files/common/watcher';
import { Event } from 'vs/base/common/event';
import { ParcelWatcher } from 'vs/platform/files/node/watcher/parcel/parcelWatcher';
import { NodeJSWatcher } from 'vs/platform/files/node/watcher/nodejs/nodejsWatcher';
import { Promises } from 'vs/base/common/async';
import { URI } from 'vs/base/common/uri';
import { ILogService, LogLevel } from 'vs/platform/log/common/log';
import { LoggerService } from 'vs/platform/log/node/loggerService';
import { LogService } from 'vs/platform/log/common/logService';

export class UniversalWatcher extends Disposable implements IUniversalWatcher {

	private readonly recursiveWatcher = this._register(new ParcelWatcher());
	private readonly nonRecursiveWatcher = this._register(new NodeJSWatcher());

	readonly onDidChangeFile = Event.any(this.recursiveWatcher.onDidChangeFile, this.nonRecursiveWatcher.onDidChangeFile);
	readonly onDidError = Event.any(this.recursiveWatcher.onDidError, this.nonRecursiveWatcher.onDidError);

	private logsHome: URI | undefined;
	private logVerbose: boolean | undefined;
	private logService: ILogService | undefined;

	constructor() {
		super();

		this.registerListeners();
	}

	private registerListeners(): void {
		this._register(Event.any(this.recursiveWatcher.onDidLogMessage, this.nonRecursiveWatcher.onDidLogMessage)(e => this.onDidLogMessage(e)));
	}

	private onDidLogMessage(e: ILogMessage): void {
		if (!this.logsHome) {
			return;
		}

		if (!this.logService) {
			const loggerService = new LoggerService(LogLevel.Info, this.logsHome);
			const logger = loggerService.createLogger('fileWatcher', { name: localize('fileWatcher', "File Watcher") });
			this.logService = new LogService(logger);

			if (this.logVerbose) {
				this.logService.setLevel(LogLevel.Trace);
			}
		}

		switch (e.type) {
			case 'trace':
				this.logService.trace(e.message);
				break;
			case 'debug':
				this.logService.debug(e.message);
				break;
			case 'info':
				this.logService.info(e.message);
				break;
			case 'warn':
				this.logService.warn(e.message);
				break;
			case 'error':
				this.logService.error(e.message);
				break;
		}
	}

	async watch(requests: IUniversalWatchRequest[]): Promise<void> {
		const recursiveWatchRequests: IRecursiveWatchRequest[] = [];
		const nonRecursiveWatchRequests: INonRecursiveWatchRequest[] = [];

		for (const request of requests) {
			if (request.recursive) {
				recursiveWatchRequests.push(request);
			} else {
				nonRecursiveWatchRequests.push(request);
			}
		}

		await Promises.settled([
			this.recursiveWatcher.watch(recursiveWatchRequests),
			this.nonRecursiveWatcher.watch(nonRecursiveWatchRequests)
		]);
	}

	async setLogging(logsHome: URI, verbose: boolean): Promise<void> {
		this.logsHome = URI.revive(logsHome);
		this.logVerbose = verbose;

		await Promises.settled([
			this.recursiveWatcher.setLogging(logsHome, verbose),
			this.nonRecursiveWatcher.setLogging(logsHome, verbose)
		]);
	}

	async stop(): Promise<void> {
		await Promises.settled([
			this.recursiveWatcher.stop(),
			this.nonRecursiveWatcher.stop()
		]);
	}
}
