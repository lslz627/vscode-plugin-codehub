// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const url = require('url');


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed


/**
 * 获取当前所在工程根目录，有3种使用方法：<br>
 * getProjectPath(uri) uri 表示工程内某个文件的路径<br>
 * getProjectPath(document) document 表示当前被打开的文件document对象<br>
 * getProjectPath() 会自动从 activeTextEditor 拿document对象，如果没有拿到则报错
 * @param {*} document 
 */
function getProjectPath(document) {
	if (!document) {
		document = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document : null;
	}
	if (!document) {
		this.showError('当前激活的编辑器不是文件或者没有文件被打开！');
		return '';
	}
	const currentFile = (document.uri ? document.uri : document).fsPath;
	let projectPath = null;

	let workspaceFolders = vscode.workspace.workspaceFolders.map(item => item.uri.path);
	/*
	// 由于存在Multi-root工作区，暂时没有特别好的判断方法，先这样粗暴判断
	// 如果发现只有一个根文件夹，读取其子文件夹作为 workspaceFolders
	if (workspaceFolders.length == 1 && workspaceFolders[0] === vscode.workspace.rootPath) {
		const rootPath = workspaceFolders[0];
		var files = fs.readdirSync(rootPath);
		workspaceFolders = files.filter(name => !/^\./g.test(name)).map(name => path.resolve(rootPath, name));
		// vscode.workspace.rootPath会不准确，且已过时
		// return vscode.workspace.rootPath + '/' + this._getProjectName(vscode, document);
	}
	*/
	workspaceFolders.forEach(folder => {
		if (currentFile.indexOf(folder) === 0) {
			projectPath = folder;
		}
	})
	if (!projectPath) {
		this.showError('获取工程根路径异常！');
		return '';
	}

	return projectPath;
}

function getUriLink(uri) {
	const codehubUri = vscode.workspace.getConfiguration().get('codehub.uri', '');

	// if (!codehubUri) {
	// 	vscode.window.showErrorMessage("没有配置 codehub.uri 变量");
	// 	return;
	// }

	const codehubStripePrefix = vscode.workspace.getConfiguration().get('codehub.stripePrefix', '');
	const projectPath = getProjectPath(uri);
	var relativePath = uri.path.substring(projectPath.length);

	if (codehubStripePrefix) {
		if (relativePath.startsWith(codehubStripePrefix)) {
			relativePath = relativePath.substring(codehubStripePrefix.length);
		}

		if (relativePath.startsWith('/' + codehubStripePrefix)) {
			relativePath = relativePath.substring(codehubStripePrefix.length + 1);
		}
	}

	const curlPath = url.resolve(codehubUri, relativePath);

	return curlPath
}

function getUriCurl(uri) {
	const curlPath = getUriLink(uri);
	const codehubAuth = vscode.workspace.getConfiguration().get('codehub.auth', '');
	var content = "";
	if (codehubAuth) {
		content = "curl -fsSL -H 'Authorization: " + codehubAuth + "' " + curlPath;
	} else {
		content = "curl -fsSL " + curlPath;
	}

	return content;
}

function writeClipboard(content) {
	vscode.env.clipboard.writeText(content);
	vscode.window.showInformationMessage(content);
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "codehub" is now active!');

	let link = vscode.commands.registerCommand('extension.codehub.link', function (uri) {
		const content = getUriLink(uri);
		writeClipboard(content);
	});
	context.subscriptions.push(link);

	let curl = vscode.commands.registerCommand('extension.codehub.curl', function (uri) {
		const content = getUriCurl(uri);
		writeClipboard(content);
	});
	context.subscriptions.push(curl);

	let bash = vscode.commands.registerCommand('extension.codehub.bash', function (uri) {
		var content = getUriCurl(uri);
		content = 'time /bin/bash -c "$(' + content + ')"'
		writeClipboard(content);
	});
	context.subscriptions.push(bash);

}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
