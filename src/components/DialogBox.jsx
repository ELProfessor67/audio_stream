import {IoMdClose} from 'react-icons/io';

export default function Dialog({open,onClose,children}){
	return(
		<div className={`absolute top-0 left-0 right-0 bottom-0 bg-black/5 grid place-items-center ${open ? '': 'hidden'}`}>
			<div className="max-w-[40rem] w-[40rem] min-h-[35rem] bg-white shadow-md p-4 rounded-md flex flex-col">
				<div className="top flex justify-between items-center">
					<button className="bg-none outline-none border-none" onClick={onClose}>
						<IoMdClose size={30}/>
					</button>
				</div>
				<div className="body py-4 flex-1 overflow-auto">
					{children}
				</div>
			</div>
		</div>
	);
}