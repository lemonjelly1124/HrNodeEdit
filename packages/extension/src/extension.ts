/* eslint-disable @typescript-eslint/naming-convention */
import 'reflect-metadata';
import './service/service-registry';
import './controller/contoller-registry';
import { ExtensionContext, ViewColumn, commands, window } from 'vscode';
import { ViewProviderSidebar } from './view-provider/view-provider-sidebar';
import { ViewProviderPanel } from './view-provider/view-provider-panel';
import { getControllers } from 'cec-client-server/decorator';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import os = require('os');
import { SimpleTreeDataProvider } from './SimpleTreeDataProvider';
//import CryptoJS = require("crypto-js");

let projectPath = '';
let projectData: any;
let webviewPanels: vscode.WebviewPanel[] = [];
let isSaveNodeToFile = true;
let isSubThreadActived = false;
let isMainThreadActived = false;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
let treeViewProvider: SimpleTreeDataProvider;
let webViewProvider: ViewProviderSidebar;
export function activate(context: ExtensionContext) {
    //创建primary sidebar 视图
    createPrimarySidebarView(context);
    const panelViewDisposable = commands.registerCommand('panel-view-container.show', () => {
        openMainThreadView(context, '');
    });
    //设置文件图标
    setFileIcon(context);
    // 监听打开的文本文件
    const panelLe = vscode.workspace.onDidOpenTextDocument((document) => {
        const ext = path.extname(document.fileName).toLowerCase();

        if (ext === '.ndjs') {
            const filePath = document.uri.fsPath;
            const fileName = path.basename(filePath);
            openMainThreadView(context, filePath);
            // 遍历所有标签组中的标签页
            for (const group of vscode.window.tabGroups.all) {
                for (const tab of group.tabs) {
                    if (tab.input instanceof vscode.TabInputText && tab.input.uri.path.endsWith(fileName)) {
                        vscode.window.tabGroups.close(tab);
                        return; // 关闭后退出函数
                    }
                }
            }
        }
    });
    context.subscriptions.push(panelViewDisposable, panelLe);
}

async function createPrimarySidebarView(context: ExtensionContext) { 
    const { callables, subscribables } = getControllers();

    
    webViewProvider = new ViewProviderSidebar(context, { callables, subscribables });
    //注册sidebar webview视图
    window.registerWebviewViewProvider('sidebar-view-container',webViewProvider,{ webviewOptions: { retainContextWhenHidden: true } });
    //注册sidebar treeview视图
    treeViewProvider = new SimpleTreeDataProvider(context);
    vscode.window.registerTreeDataProvider('treeView', treeViewProvider);

    vscode.commands.registerCommand('extension.searchNode', (nodeId: string) => { 
        treeViewProvider.updateJsonData(projectData, nodeId);
    });

    vscode.commands.registerCommand('extension.handleButtonClick', (nodeId: string) => {
        
        wayTitle = "";
        wayId = "";
        searchNodeByID(nodeId);
        wayTitle = "主线程->" + wayTitle.substring(0, wayTitle.length - 2);
        wayId = "main->" + wayId.substring(0, wayId.length - 2);
        const titles = wayTitle.split('->');
        const partrnttitle = titles[titles.length - 2];
        
        const ids = wayId.split('->');
        const parentId = ids[ids.length - 2];
        
        openSubThread(context, { id: parentId, title: partrnttitle },nodeId);
    });

    

}
async function openMainThreadView(context: ExtensionContext, path: string) {
    
    webviewPanels.forEach(panel => {
        panel.webview.postMessage({ type: 'panelactive', data: 'main' });
    });
    await delay(100);
    if (isMainThreadActived) {
        isMainThreadActived = false;
        return '';
    }
    const { callables, subscribables } = getControllers();
    const viewProviderPanel = new ViewProviderPanel(context, { callables, subscribables });
    const panel = window.createWebviewPanel(
        'panel-view-container',
        '主线程',
        ViewColumn.One,
        {
            retainContextWhenHidden: true,
            localResourceRoots: [vscode.Uri.file(context.extensionPath)] // 本地资源路径
        }   //切换标签页时，webview不销毁
    );
    panel.iconPath = {
        light: vscode.Uri.file(vscode.Uri.joinPath(context.extensionUri, 'image', 'hr.svg').fsPath),
        dark: vscode.Uri.file(vscode.Uri.joinPath(context.extensionUri, 'image', 'hr.svg').fsPath)
    };
    await viewProviderPanel.resolveWebviewView(panel);
    panel.webview.onDidReceiveMessage(
        async (message) => {
            await handleWebviewMessage(message, panel, context);
        },
        undefined,
        context.subscriptions
    );
    webviewPanels.push(panel);
    panel.onDidDispose(() => {
        const index = webviewPanels.indexOf(panel);
        if (index !== -1) {
            webviewPanels.splice(index, 1);
        }
        if (webviewPanels.length === 0) {
            checkNodeData();
            projectPath = '';
            projectData = [];
        }   //全部节点编辑页面关闭后校验数据
    });
    if (path !== '') {
        projectPath = path;
        projectData = await readProjectData(projectPath);
        const mainElement = projectData.find((element: any) => element.parentID === 'main');
        const nodes = await getSubThreadNodes();
        await delay(500);
        treeViewProvider.updateJsonData(projectData);       //刷新节点树
        checkNodeData();
        panel.webview.postMessage({ type: 'openprojectback', path: projectPath, data: mainElement, threadid: 'main' });
        panel.webview.postMessage({ type: 'setnodeoptions', data: nodes });
    }
    return '';
}

//获取所有isSubthread为true的节点
async function getSubThreadNodes() {
    const nodes: any[] = [];
    for (const element of projectData) {
        for (const node of element.nodes) {
            if (node.data.isSubthread) {
                nodes.push(node);
            }
        }
    }
    return nodes;
}

// Extracted function to handle the messages
async function handleWebviewMessage(
    message: any,
    panel: vscode.WebviewPanel,
    context: vscode.ExtensionContext
) {
    switch (message.type) {
        case 'loginfo':
            await setFileIcon(context);
            break;
        case 'createnodefile':
            await createNewFile(panel);
            break;
        case 'opencode':
            await openNewFileWithContent(message.data.path);
            break;
        case 'savecode':
            panel.webview.postMessage({ type: 'savecodeback', data: 'extensionDaTa' });
            await saveAllFiles();
            break;
        case 'openproject':
            projectPath = await openProject();
            projectData = await readProjectData(projectPath);
            const mainElement = projectData.find((element: any) => element.parentID === 'main');
            panel.webview.postMessage({ type: 'openprojectback', path: projectPath, data: mainElement, threadid: 'main' });
            break;
        case 'importnode':
            const jsonData = await openFileAndReadJson();
            panel.webview.postMessage({ type: 'importnodeback', data: jsonData });
            break;
        case 'subthread':
            await openSubThread(context, message.data);
            break;
        case 'savenode':
            await saveNode(message.data);
            break;
        case 'saveallnode':
            await saveAllNode();
            break;
        case 'nodestatechanged':
            await nodeStatChanged(message.data);
            break;
        case 'panelactiveback':
            panel.reveal();
            if (message.data.parentid === 'main') {
                isMainThreadActived = true;
            }
            else {
                isSubThreadActived = true;
            }
            break;
        case 'searchid':
            break;
        case 'nodetitlechange':
            await nodeTitleChange(message.data);
            break;
        default:
            console.error('Unknown message type:', message.type);
            break;
    }
}

//新建项目节点文件
async function createNewFile(panel: vscode.WebviewPanel) {
    try {
        // 弹出输入框，获取文件名
        const fileName = await vscode.window.showInputBox({
            placeHolder: '请输入项目名称',
            prompt: '请输入项目名称',
        });

        if (!fileName) {
            vscode.window.showErrorMessage('文件名不能为空');
            return;
        }

        // 弹出文件夹选择对话框，选择文件夹
        const folderUri = await vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectFiles: false,
            openLabel: '选择文件夹',
            defaultUri: vscode.Uri.file(vscode.workspace.rootPath || '')
        });

        if (!folderUri || folderUri.length === 0) {
            vscode.window.showErrorMessage('没有选择文件夹');
            return;
        }
        const folderPath = folderUri[0].fsPath;

        // 构建文件的完整路径
        const filePath = path.join(folderPath, fileName + '.ndjs');
        const content = '[{"nodes":[],"edges":[],"parentID":"main"}]';

        // 创建并写入文件
        fs.writeFile(filePath, content, (err) => {
            if (err) {
                vscode.window.showErrorMessage(`文件创建失败: ${err.message}`);
            } else {
                vscode.window.showInformationMessage(`文件已创建并写入内容: ${filePath}`);
            }
        });

        projectPath = filePath;
        projectData = projectData = JSON.parse(content);;
        const mainElement = projectData.find((element: any) => element.parentID === 'main');
        panel.webview.postMessage({ type: 'openprojectback', path: projectPath, data: mainElement, threadid: 'main' });
    } catch (error) {
        vscode.window.showErrorMessage(`出现错误: 创建失败` + error);
    }
}

//新建代码标签页
async function openNewFileWithContent(path: string) {
    //vscode.window.showInformationMessage("路径" + path);
    openFileInSplitEditor(path);
}

//保存所有代码文件
async function saveAllFiles() {
    const documents = vscode.workspace.textDocuments;
    for (const document of documents) {
        if (document.isDirty) {
            await document.save();
        }
    }
}

//打开项目文件
async function openProject() {
    const options: vscode.OpenDialogOptions = {
        canSelectMany: false,
        openLabel: 'Open',
        filters: {
            'NODE': ['ndjs'],
            'All Files': ['*']
        }
    };
    const fileUri = await vscode.window.showOpenDialog(options);
    if (!fileUri) {
        return '';
    }
    const filePath = fileUri[0].fsPath;
    return filePath;
}

//打开文件选择器，选择一个文件，读取里面的json数据(导入模板)
async function openFileAndReadJson() {
    const options: vscode.OpenDialogOptions = {
        canSelectMany: false,
        openLabel: 'Open',
        filters: {
            'NODE': ['ndjs'],
            'All Files': ['*']
        }
    };
    const fileUri = await vscode.window.showOpenDialog(options);
    if (!fileUri) {
        return;
    }
    const filePath = fileUri[0].fsPath;
    return await readProjectData(filePath);
}
async function openFileInSplitEditor(filePath: string) {
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
        // 创建空文件或者带有默认内容的文件
        saveProjetData(filePath, "");
    }
    // 获取当前活动的编辑器
    const activeEditor = vscode.window.activeTextEditor;
    // 获取所有可见的编辑器
    const visibleEditors = vscode.window.visibleTextEditors;
    // 检查是否已经拆分
    const hasRightEditor = visibleEditors.some(editor => editor.viewColumn === vscode.ViewColumn.Beside);
    // 打开文件并关闭预览模式
    const showFileOptions: vscode.TextDocumentShowOptions = {
        viewColumn: vscode.ViewColumn.Beside, // 在右侧拆分编辑器
        preview: false // 关闭预览模式
    };
    // 打开或显示文件
    vscode.workspace.openTextDocument(filePath).then((document) => {
        if (!hasRightEditor) {
            // 如果没有拆分，则拆分并显示文件
            vscode.window.showTextDocument(document, showFileOptions);
        } else {
            // 如果已经拆分，直接在右侧显示文件
            const rightEditor = visibleEditors.find(editor => editor.viewColumn === vscode.ViewColumn.Beside);

            if (rightEditor) {
                // 如果右侧编辑器已经存在，直接显示文件
                vscode.window.showTextDocument(document, rightEditor.viewColumn);
            } else {
                // 如果右侧编辑器不存在，则拆分并显示文件
                vscode.window.showTextDocument(document, showFileOptions);
            }
        }
    }, (error) => {
        vscode.window.showErrorMessage(`打开文件失败: ${error.message}`);
    });
}
async function openSubThread(context: ExtensionContext, data: any,centerNodeid?:string) {

    webviewPanels.forEach(panel => {
        panel.webview.postMessage({ type: 'panelactive', data: data.id });
        if (centerNodeid&&centerNodeid!=='main') {
            panel.webview.postMessage({ type: 'setnodetocenter', data: centerNodeid });
        }
    });

    await delay(50);
    if (isSubThreadActived || isMainThreadActived) {
        isSubThreadActived = false;
        isMainThreadActived = false;
        return '';
    }
    const { callables, subscribables } = getControllers();
    const title = data.title;
    const threadid = data.id;

    const viewProviderPanel = new ViewProviderPanel(context, { callables, subscribables });
    const panel = window.createWebviewPanel(
        'panel-view-container',
        title,
        ViewColumn.One,
        {
            retainContextWhenHidden: true,
            localResourceRoots: [vscode.Uri.file(context.extensionPath)] // 本地资源路径
        }   //切换标签页时，webview不销毁
    );
    panel.iconPath = {
        light: vscode.Uri.file(vscode.Uri.joinPath(context.extensionUri, 'image', 'hr.svg').fsPath),
        dark: vscode.Uri.file(vscode.Uri.joinPath(context.extensionUri, 'image', 'hr.svg').fsPath)
    };
    viewProviderPanel.resolveWebviewView(panel);

    panel.webview.onDidReceiveMessage(
        async (message) => {
            await handleWebviewMessage(message, panel, context);
        },
        undefined,
        context.subscriptions
    );
    const nodes = await getSubThreadNodes();
    const mainElement = projectData.find((element: any) => element.parentID === threadid);
    await delay(200);
    panel.webview.postMessage({ type: 'openprojectback', path: projectPath, data: mainElement, threadid: threadid });
    panel.webview.postMessage({ type: 'setnodeoptions', data: nodes });
    if (centerNodeid && centerNodeid !== 'main') {
        panel.webview.postMessage({ type: 'setnodetocenter', data: centerNodeid });
    }

    webviewPanels.push(panel);
    panel.onDidDispose(() => {
        const index = webviewPanels.indexOf(panel);
        if (index !== -1) {
            webviewPanels.splice(index, 1);
        }
        if (webviewPanels.length === 0) {
            checkNodeData();
            projectPath = '';
            projectData = [];
        }   //全部节点编辑页面关闭后校验数据
    });
    return '';
}

async function saveNode(data: any) {
    const pareaentID = data.parentID;
    const element = projectData.find((element: any) => element.parentID === pareaentID);
    if (element) {
        element.nodes = data.nodes;
        element.edges = data.edges;
    } else {
        projectData.push(data);
    }

    if (isSaveNodeToFile) {
        saveProjetData(projectPath, projectData);
        treeViewProvider.updateJsonData(projectData);
        vscode.window.showInformationMessage('保存节点成功');
    }
}

async function logInfo(_params: any) {
}
//保存所有标签页的节点数据
async function saveAllNode() {
    isSaveNodeToFile = false;
    webviewPanels.forEach(panel => {
        if (panel && panel.webview) {
            panel.webview.postMessage({ type: 'saveallnodeback', data: {} });
        }
    });
    await delay(2000);
    isSaveNodeToFile = true;
    saveProjetData(projectPath, projectData);
}


//节点状态变化时
async function nodeStatChanged(data: any) {
    const pareaentID = data.parentid;
    for (const element of projectData) {
        if (element.parentID === pareaentID) {
            for (const node of element.nodes) {
                if (node.id === data.node.id) {
                    node.data.isRunning = data.node.data.isRunning;
                    node.data.isSubthread = data.node.data.isSubthread;
                    node.data.isNormal = data.node.data.isNormal;
                    break;
                }
            }
            break;
        }
    }
}
//删除文件
const deleteFile = (filePath: string): void => {
    if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error("Error deleting file:", err);
                return;
            }
        });
    }
};

//检查节点数据，删除无效数据和文件
async function checkNodeData() {
    const projectDir = projectPath.substring(0, projectPath.lastIndexOf('\\'));
    const nodeidArr = ['main'];
    for (const element of projectData) {
        for (const node of element.nodes) {
            if (node.data.isSubthread) {   //有子线程的节点删除代码文件
                deleteFile(projectDir + '\\' + node.data.title + '_' + node.id + '.py');
            } else {
                projectData = projectData.filter((item: any) => item.parentID !== node.id);    //删除没有子线程状态的节点的子线程
            }
            nodeidArr.push(node.id);
        }
    }
    const files = fs.readdirSync(projectDir);
    for (const file of files) {
        if (file.endsWith('.py')) {
            const id = file.substring(file.lastIndexOf('_') + 1, file.lastIndexOf('.'));
            if (!nodeidArr.includes(id)) {
                deleteFile(projectDir + '\\' + file);       //删除删除节点对应的代码文件
            }
        }
    }
    for (const element of projectData) {
        if (!nodeidArr.includes(element.parentID)) {
            projectData = projectData.filter((item: any) => item.parentID !== element.parentID);    //删除没有节点的线程
        }
    }
    saveProjetData(projectPath, projectData);
}

let wayTitle = '';
let wayId='';
//根据节点ID搜索节点所在位置
async function searchNodeByID(id: string) {
    for (const element of projectData) {
        for (const node of element.nodes) {
            if (node.id === id) {
                if (element.parentID !== 'main') {
                    wayTitle = node.data.title + '->' + wayTitle;
                    wayId=node.id+'->'+wayId;
                    await searchNodeByID(element.parentID);
                } else {
                    wayTitle = node.data.title + '->' + wayTitle;
                    wayId = node.id + '->' + wayId;
                }
            }
        }
    }

}


async function saveProjetData(path: string, projectData: any) {
    const jsonData = JSON.stringify(projectData);
    //const encryptedText=await encryptAndCopyToClipboard(jsonData);
    fs.writeFileSync(path, jsonData, 'utf8');
}

async function readProjectData(path: string) {
    const fileContent = fs.readFileSync(path, 'utf8');
    return JSON.parse(fileContent);
}

//节点标题修改
async function nodeTitleChange(node: any) {
    console.log(node);
    const oldFile = node.oldtitle + '_' + node.id + '.py';
    const newFile = node.newtitle + '_' + node.id + '.py';
    const projectDir = projectPath.substring(0, projectPath.lastIndexOf('\\'));
    const files = fs.readdirSync(projectDir);



    const openEditors = vscode.window.visibleTextEditors;
    for (const editor of openEditors) {
        if (editor.document.fileName === projectDir + '\\' + oldFile) {
            //保存旧文件的代码
            await editor.document.save();
            //重命名文件
            if (files.concat(node.oldtitle + '_' + node.id + '.py')) {
                fs.renameSync(projectDir + '\\' + oldFile, projectDir + '\\' + newFile);
            }
            editor.hide();
            //打开重命名后的新文件
            const document = await vscode.workspace.openTextDocument(projectDir + '\\' + newFile);
            await vscode.window.showTextDocument(document, {
                preview: true, // 使用预览模式替换当前文件
                viewColumn: editor.viewColumn, // 保持在当前标签页
            });
        }

    }

}
//依赖vscode-icons插件，设置文件图标
async function setFileIcon(context: ExtensionContext) {
    const username = os.userInfo().username;
    const settingsPath = 'C:\\Users\\' + username + '\\AppData\\Roaming\\Code\\User\\settings.json';
    const fileContent = fs.readFileSync(settingsPath, 'utf8');
    const settingsJson = JSON.parse(fileContent);

    if (settingsJson !== "") {
        if (settingsJson['workbench.iconTheme']) {
            if (!settingsJson['vsicons.associations.files']) {
                const iconpath = vscode.Uri.joinPath(context.extensionUri, 'image', 'file_type_icon_hr32.svg').fsPath;
                const vscodeicons = 'C:\\Users\\' + username + '\\AppData\\Roaming\\Code\\User\\vsicons-custom-icons\\';
                if (!fs.existsSync(vscodeicons)) {
                    fs.mkdirSync(vscodeicons, { recursive: true });
                }
                const iconFileName = path.basename(iconpath);
                const destinationPath = path.join(vscodeicons, iconFileName);
                fs.copyFileSync(iconpath, destinationPath);

                delay(3000);
                settingsJson['vsicons.associations.files'] = 'vscode-icons';
                const fileIconArr = [{ "icon": "icon_hr32", "extensions": ["ndjs"], "format": "svg" }];
                settingsJson['vsicons.associations.files'] = fileIconArr;
                fs.writeFileSync(settingsPath, JSON.stringify(settingsJson, null, 4), 'utf8');
            }
        }
    } else {
        vscode.window.showErrorMessage('读取settings.json文件失败');
    }


}

export function deactivate() { }
