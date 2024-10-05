import {IoMdClose} from 'react-icons/io';
import {AiOutlineUser} from 'react-icons/ai';
import {IoSearch} from 'react-icons/io5';

export default function CallComponents({open,onClose,children,name,setName}){
	return(
		<div className={`absolute top-0 left-0 right-0 bottom-0 bg-black/5 ${open ? '': 'hidden'}`}>
			<div className="max-w-[20rem] h-[20rem] mx-auto mt-52 bg-white shadow-md p-4 rounded-md flex flex-col">
				<div className="top flex justify-between items-center">
					<button className="bg-none outline-none border-none" onClick={onClose}>
						<IoMdClose size={30}/>
					</button>
				</div>

				<div className="body py-4 flex-1 overflow-auto relative" style={{flex: 'none', height: '17rem',overflowY: 'auto'}}>
					{children}
				</div>
			</div>
		</div>
	);
}