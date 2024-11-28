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
    };
    const onSearchClick = () => { 
        vscode?.postMessage({ command: 'searchNode', data: searchNode });
    }
    return (
        <div className='sidebarview'>
            <div className='searchnode-div'>
                <input type='text' value={searchNode} placeholder='Search node' className='searchnode'  onChange={handleInputChange}/>
                <button className='searchnode' onClick={onSearchClick}>Search</button>
            </div>
        </div>
    );
}
export default SideBarView;