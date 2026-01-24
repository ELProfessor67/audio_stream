import {IoMdClose} from 'react-icons/io';
import {AiOutlineUser} from 'react-icons/ai';
import {IoSearch} from 'react-icons/io5';

export default function CallComponents({open,onClose,children,name,setName}){
	return(
		<div className={`absolute top-0 left-0 right-0 bottom-0 bg-black/5 ${open ? '': 'hidden'}`}>
			<div className="max-w-[25rem] h-[28rem] mx-auto mt-20 bg-[#2f3237] shadow-md p-4 rounded-md flex flex-col">
				<div className="top flex justify-end items-center">
					<button className="bg-none outline-none border-none text-white" onClick={onClose}>
						<IoMdClose size={30}/>
					</button>
				</div>

				<div className="body py-4 flex-1 overflow-auto relative" style={{flex: 'none', height: '24rem',overflowY: 'auto'}}>
					{children}
				</div>
			</div>
		</div>
	);
}