import {IoMdClose} from 'react-icons/io';
import {AiOutlineUser} from 'react-icons/ai';
import {IoSearch} from 'react-icons/io5';

export default function Dialog({open,onClose,children,seletdSongs,save,selectAll,name,setName,search,heading,bottomSave}){
	return(
		<div className={`absolute top-0 left-0 right-0 bottom-0 bg-black/5 ${open ? '': 'hidden'}`}>
			<div className="max-w-[40rem] min-h-[35rem] mx-auto mt-16 bg-white shadow-md p-4 rounded-md flex flex-col relative">
				<div className="top flex justify-between items-center">
					{
						selectAll && 
						<button className="py-2 px-4 rounded-md bg-indigo-500 text-white" onClick={selectAll}>Select All</button>
					}
					{
						heading &&
						<span className="text-xl">{heading}</span>
					}
					{
						save && <button className="py-2 px-4 rounded-md bg-indigo-500 text-white" onClick={save}>Save</button>
					}

					{seletdSongs 
						? <span className="text-2xl">{seletdSongs?.length} Selected</span>
						: <span className="text-2xl"></span>
					}
					{
						setName && <div className="flex-1 pr-[10rem]">
							<div className='input-group flex flex-col gap-1'>
		                        <div className='flex items-center relative py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
		                        	{
		                        		search ? <IoSearch size={20} className='text-gray-400'/>: <AiOutlineUser size={20} className='text-gray-400'/>
		                        	}
		                            
		                            <input type='text' value={name} onChange={(e) => setName(e.target.value)} className='w-[95%] outline-none ml-1' placeholder={search ? 'Search...' : 'Enter your name'} id='name' name='name' required/>
		                        </div>   
		                    </div>
						</div>
					}

					<button className="bg-none outline-none border-none" onClick={onClose}>
						<IoMdClose size={30}/>
					</button>
				</div>

				<div className="body py-4 flex-1 overflow-auto" style={{flex: 'none', height: '30rem',overflowY: 'auto'}}>
					{children}
				</div>
				{
					bottomSave &&
					<div className='flex justify-end items-center'>
						<button className="py-2 px-4 rounded-md bg-indigo-500 text-white" onClick={bottomSave}>Save</button>
					</div>
				}
			</div>
		</div>
	);
}