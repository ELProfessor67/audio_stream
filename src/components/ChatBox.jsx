import { IoMdClose } from 'react-icons/io';
import ScrollToBottom from 'react-scroll-to-bottom';


export default function ChatBox({ open, onClose, children, setName, name, message, setMessage, handleSendMessage }) {
    return (
        <div className={`absolute top-0 left-0 right-0 bottom-0 bg-black/5 ${open ? '' : 'hidden'}`}>
            <div className="max-w-[40rem] mx-auto mt-16 min-h-[35rem] bg-white shadow-md p-4 rounded-md flex flex-col">
                <div className="top flex justify-between items-center">
                    {
                        setName &&
                        <div className="flex-1 pr-[10rem]">
                            <div className='input-group flex flex-col gap-1'>
                                <div className='flex items-center relative py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
                                    <input type='text' value={name} onChange={(e) => setName(e.target.value)} className='w-[95%] outline-none ml-1' placeholder={'Enter your name'} id='name' name='name' />
                                </div>
                            </div>
                        </div>
                    }
                    <button className="bg-none outline-none border-none" onClick={onClose}>
                        <IoMdClose size={30} />
                    </button>
                </div>
                <div className="body py-4 flex-1 overflow-auto relative" style={{ flex: 'none', height: '28rem', overflowY: 'auto' }}>
                    <ScrollToBottom className='w-full h-full'>
                        {children}
                    </ScrollToBottom>
                </div>
                <div className='w-full flex gap-4 items-center mt-2'>
                    <div className='flex flex-1 items-center relative py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
                        <input type='text' className='w-[95%] outline-none ml-1' placeholder={'Type something...'} id='name' name='name' value={message} onChange={(e) => setMessage(e.target.value)}/>
                    </div>
                    <div>
                        <button onClick={handleSendMessage} className='bg-indigo-500 border-none py-2 px-4 rounded-md outline-none text-white disabled:cursor-[not-allowed] disabled:bg-indigo-200 cursor-pointer disabled:text-gray-200'>Send</button>
                    </div>
                </div>
            </div>
        </div>
    );
}