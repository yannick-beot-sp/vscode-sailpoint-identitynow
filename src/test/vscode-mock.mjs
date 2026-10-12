/**
 * Minimal vscode module used when unit tests run as ESM, outside the extension host.
 */
function uriFrom(components) {
	const uri = {
		scheme: components.scheme ?? "",
		authority: components.authority ?? "",
		path: components.path ?? "",
		query: components.query ?? "",
		fragment: components.fragment ?? "",
		with(change) {
			return uriFrom({ ...this, ...change });
		},
		toString() {
			const authority = this.authority ? `//${this.authority}` : "";
			return `${this.scheme}:${authority}${this.path}`;
		},
	};
	return uri;
}

class TreeItem {
	constructor(label, collapsibleState) {
		this.label = label;
		this.collapsibleState = collapsibleState;
	}
}

class ThemeIcon {
	constructor(id, color) {
		this.id = id;
		this.color = color;
	}
}

class EventEmitter {
	constructor() {
		this.event = () => ({ dispose() {} });
	}
	fire() {}
	dispose() {}
}

const TreeItemCollapsibleState = { None: 0, Collapsed: 1, Expanded: 2 };

const commands = {
	executeCommand: async () => undefined,
};

class DataTransferItem {
	constructor(value) {
		this.value = value;
	}
	asString() {
		return Promise.resolve(typeof this.value === "string" ? this.value : JSON.stringify(this.value));
	}
	asFile() {
		return undefined;
	}
}

const vscode = {
	version: "1.105.0",
	TreeItem,
	ThemeIcon,
	EventEmitter,
	TreeItemCollapsibleState,
	DataTransferItem,
	commands,
	Uri: {
		parse: (value) => ({ toString: () => value }),
		from: (components) => uriFrom(components),
		joinPath: (base, ...parts) => uriFrom({
			...base,
			path: [base.path, ...parts].join("/").replace(/\/{2,}/g, "/"),
		}),
	},
	extensions: {
		getExtension: () => ({ packageJSON: { version: "0.0.0-test" } }),
	},
	env: {
		clipboard: { writeText: async () => undefined },
		openExternal: async () => true,
	},
	window: {
		showInformationMessage: () => undefined,
		showWarningMessage: () => undefined,
		showErrorMessage: () => undefined,
	},
};

export default vscode;
export const version = vscode.version;
export const Uri = vscode.Uri;
export const extensions = vscode.extensions;
export const env = vscode.env;
export const window = vscode.window;
export { TreeItem, ThemeIcon, EventEmitter, TreeItemCollapsibleState, DataTransferItem, commands };
