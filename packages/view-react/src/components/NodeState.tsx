/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import './NodeState.css'
interface StatusBarProps {
    isRunning: boolean;
    isSubThread: boolean;
    isNormal: boolean;
    isSubBtnHide?: boolean;
    onStatusChange: (status: { isRunning: boolean; isSubThread: boolean; isNormal: boolean }) => void;
}

const StateBar: React.FC<StatusBarProps> = ({ isRunning, isSubThread, isNormal, isSubBtnHide, onStatusChange }) => {

    const handleCheckboxChange = (field: string) => {
        const newStatus = {
            isRunning: field === 'isRunning' ? !isRunning : isRunning,
            isSubThread: field === 'isSubThread' ? !isSubThread : isSubThread,
            isNormal: field === 'isNormal' ? !isNormal : isNormal,
        };
        onStatusChange(newStatus);
    };

    return (
        <div className="nodestate">
            <label>
                <input
                    type="checkbox"
                    checked={isRunning}
                    onChange={() => handleCheckboxChange('isRunning')}
                />
                正在运行
            </label>
            {!isSubBtnHide && <label>
                <input
                    type="checkbox"
                    checked={isSubThread}
                    onChange={() => handleCheckboxChange('isSubThread')}
                />
                子线程
            </label>}
            <label>
                <input
                    type="checkbox"
                    checked={isNormal}
                    onChange={() => handleCheckboxChange('isNormal')}
                />
                正常
            </label>
        </div>
    );

};

export default StateBar;