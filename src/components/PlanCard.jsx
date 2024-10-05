import React, { useState } from 'react'
import {FaQuestionCircle,FaArrowCircleDown,FaArrowCircleUp} from 'react-icons/fa'

const PlanCard = ({ name,description,price,peroid,features,color,setSelectedPlan,setCname,hidebtn }) => {
    const [all,setAll] = useState(false);
    return (
        <div className={`max-w-96 border border-gray-100 p-4 min-h-[35rem] shadow-md rounded-md relative m-4`}>
            <span className='hidden text-blue-600 text-purple-600 text-orange-600 from-blue-600 to-blue-500 from-orange-600 to-orange-500 from-purple-600 to-purple-500'/>
            <div className='flex justify-center items-center flex-col gap-3'>
                <h2 className={`sub-heading text-${color}-600`}>{name}</h2>
                <p className='para'>{description}</p>
            </div>

            <div className='flex justify-center items-center flex-col mt-8'>
                <h3 className='text-5xl text-black'>${price}</h3>
                <h3 className='text-xl text-black opacity-90'>Per {peroid}</h3>
            </div>
            <div className='pt-3'>
                <ul className='border-t border-gray-500'>
                    {
                        all ?
                        features?.map(({description:fdesc,name:fname}) => (
                        <li className='py-2 border-b border-gray-600 flex justify-between items-center'>
                            <span></span>
                            <span className={`text-lg text-${color}-600`}>{fname}</span>
                            <button type='button' title={fdesc}><FaQuestionCircle /></button>
                        </li>
                        ))
                        : features?.slice(0,5).map(({description:fdesc,name:fname}) => (
                            <li className='py-2 border-b border-gray-600 flex justify-between items-center'>
                                <span></span>
                                <span className={`text-lg text-${color}-600`}>{fname}</span>
                                <button type='button' title={fdesc}><FaQuestionCircle /></button>
                            </li>
                        ))
                    }
                    
                </ul>
            </div>

            {
                !hidebtn && <div className='flex justify-center items-center mt-5'>
                <button onClick={() => {setSelectedPlan(name);setCname('register')}} type='button' className={`py-2 px-5 text-white text-lg rounded-3xl bg-gradient-to-r from-${color}-600 to-${color}-500 transition-all hover:to-${color}-600`}>Start Trial</button>
            </div>
            }

            <div className='py-2 mt-4 px-10 flex items-center justify-between border-t border-gray-300'>
                <button type='button' onClick={() => setAll(true)}><FaArrowCircleDown/></button>
                <span className={`text-lg text-${color}-600`}>see all features</span>
                <button type='button' onClick={() => setAll(false)}><FaArrowCircleUp/></button>

            </div>
        </div>
    )
}

export default PlanCard