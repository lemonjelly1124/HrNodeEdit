import React, { useState } from 'react';
import './EditLabel.css'; 

interface EditTitleProps {
    Value?: string; // 可选的初始值
    type?: string;
    onEdit?: (newValue: string) => void;
    onValueChanged?: (oldValue:string,newValue: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let oldtitle:string;
const EditLabel: React.FC<EditTitleProps> = ({Value,type,onEdit,onValueChanged}) => {
    const [isEditing, setIsEditing] = useState(false);

    const handleDoubleClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        oldtitle = Value ?? '';
        setIsEditing(true);
    };
    const handleBlur = () => {
        setIsEditing(false);
        if (onValueChanged) {
            if (oldtitle !== Value) {
                onValueChanged(oldtitle, Value ?? '');
            }
            
        }
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (onEdit) {
            onEdit(event.target.value);
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            handleBlur();
        }
    };

    return (
        <div className='editlabel'>
            {isEditing ? (
                <input
                    type="text"
                    value={Value}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className={type==="title"?'input-title':'input-content'}
                />
            ) : (
                    <div className='label-content-div'>
                    <label onDoubleClick={handleDoubleClick} className={type==="title"?'label-title':'label-content'}>{Value}</label>
                </div>
            )}
        </div>
    );
};
export default EditLabel;