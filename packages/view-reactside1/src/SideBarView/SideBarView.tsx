/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import './SideBarView.css';

let vscode: ReturnType<typeof window.acquireVsCodeApi> | undefined;
const getVsCodeApi = () => {
    if (!vscode) {
        vscode = window.acquireVsCodeApi();
    }
    return vscode;
};

const SideBarView = () => {
    const vscode = getVsCodeApi();
    const [searchNode,setSearchNode] = React.useState<string>('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchNode(e.target.value);
        if (e.target.value === '') {
            vscode?.postMessage({ command: 'searchNode', data: '' });
        }
    };
    const onSearchClick = () => { 
        vscode?.postMessage({ command: 'searchNode', data: searchNode });
    }
    const onClearClick = () => { 
        setSearchNode('');
        vscode?.postMessage({ command: 'searchNode', data: searchNode });
    }
    return (
        <div className='sidebarview'>
            <div className='searchnode-div'>
                <input type='text' value={searchNode} placeholder='Search node' className='searchnode'  onChange={handleInputChange}/>
                <button className='searchnode' onClick={onSearchClick}>搜索</button>
                <button className='searchnode' onClick={onClearClick}>全部</button>
            </div>
            <div>
                <button className='searchnode' onClick={() => vscode?.postMessage({ command: 'importnode' })}>添加节点</button>
            </div>
        </div>
    );
}
export default SideBarView;