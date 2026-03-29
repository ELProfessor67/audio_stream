"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { showMessage, showError, clearMessage, clearError } from '@/utils/showAlert';

const cloudName = "ddlwhkn3b";
const cloudinaryApi = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

const uploadSignatureToCloudinary = async (blob) => {
    try {
        const formData = new FormData();
        formData.append("file", blob, "signature.png");
        formData.append("upload_preset", "images_preset");
        formData.append("folder", "SIDESONE");
        const res = await axios.post(cloudinaryApi, formData);
        return res.data.secure_url;
    } catch (error) {
        console.error("Error uploading signature:", error);
        return null;
    }
};

/* =====================================================
   REUSABLE AGREEMENT SUB-COMPONENTS
   (Identical to dj-forms/page.jsx)
===================================================== */
const AgreementSection = ({ number, title, children }) => (
    <div style={{ marginBottom: '32px' }}>
        <h2 style={{
            fontSize: '16px',
            fontWeight: '700',
            fontFamily: "'Inter', sans-serif",
            color: '#4338ca',
            marginBottom: '14px',
            paddingBottom: '8px',
            borderBottom: '1px solid #e2e8f0',
            letterSpacing: '0.01em'
        }}>
            {number}. {title}
        </h2>
        <div style={{ paddingLeft: '4px' }}>
            {children}
        </div>
    </div>
);

const AgreementItem = ({ number, children }) => (
    <p style={{
        fontSize: '14px',
        marginBottom: '8px',
        paddingLeft: '12px',
        color: '#334155',
        fontFamily: "'Georgia', serif",
        lineHeight: '1.75'
    }}>
        <span style={{
            fontWeight: '600',
            color: '#1e293b',
            marginRight: '4px'
        }}>{number}</span>{' '}
        {children}
    </p>
);

const MyFormStatus = () => {
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState(null);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [hasDrawn, setHasDrawn] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const { isAuth, user } = useSelector(store => store.user);
    const router = useRouter();
    const dispatch = useDispatch();
    const hasCheckedAuth = useRef(false);

    // Canvas refs
    const canvasRef = useRef(null);
    const isDrawingRef = useRef(false);
    const lastPointRef = useRef(null);

    useEffect(() => {
        if (hasCheckedAuth.current) return;
        if (!user) { setLoading(true); return; }
        hasCheckedAuth.current = true;
        if (!isAuth) { router.push('/login'); return; }
        if (user.isDJ !== true) { router.push('/dashboard'); return; }
        fetchFormStatus();
    }, [user, isAuth, router]);

    // Canvas setup for edit mode
    useEffect(() => {
        if (!isEditing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        ctx.scale(2, 2);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#1a1a2e';
        ctx.lineWidth = 2.5;
    }, [isEditing]);

    const getPoint = useCallback((e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    }, []);

    const startDrawing = useCallback((e) => {
        e.preventDefault();
        isDrawingRef.current = true;
        lastPointRef.current = getPoint(e);
        setHasDrawn(true);
    }, [getPoint]);

    const draw = useCallback((e) => {
        e.preventDefault();
        if (!isDrawingRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const currentPoint = getPoint(e);
        ctx.beginPath();
        ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
        ctx.lineTo(currentPoint.x, currentPoint.y);
        ctx.stroke();
        lastPointRef.current = currentPoint;
    }, [getPoint]);

    const stopDrawing = useCallback((e) => {
        e.preventDefault();
        isDrawingRef.current = false;
        lastPointRef.current = null;
    }, []);

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);
    };

    const fetchFormStatus = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get('/api/v1/dj-forms/status');
            setFormData(data.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch form status');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => {
        setEditName(formData?.contractAgreement?.contractorName || '');
        setHasDrawn(false);
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditName('');
        setHasDrawn(false);
    };

    const handleResubmit = async () => {
        if (!editName.trim()) {
            await dispatch(showError('Please enter your name'));
            await dispatch(clearError());
            return;
        }
        if (!hasDrawn) {
            await dispatch(showError('Please draw your signature'));
            await dispatch(clearError());
            return;
        }

        setSubmitting(true);
        try {
            const canvas = canvasRef.current;
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            const signatureUrl = await uploadSignatureToCloudinary(blob);
            if (!signatureUrl) {
                await dispatch(showError('Failed to upload signature. Please try again.'));
                await dispatch(clearError());
                setSubmitting(false);
                return;
            }

            await axios.put('/api/v1/dj-forms/contract', {
                contractorName: editName.trim(),
                contractorSignatureUrl: signatureUrl
            });

            await dispatch(showMessage('Agreement resubmitted successfully! Your application is now pending review.'));
            await dispatch(clearMessage());
            setIsEditing(false);
            hasCheckedAuth.current = false;
            fetchFormStatus();
        } catch (err) {
            await dispatch(showError(err.response?.data?.message || 'Failed to resubmit'));
            await dispatch(clearError());
        }
        setSubmitting(false);
    };

    if (loading) {
        return (
            <div className='min-h-screen flex items-center justify-center' style={{ background: 'linear-gradient(135deg, #f0f2f5 0%, #e8ecf1 50%, #dfe3e8 100%)' }}>
                <div className='text-center'>
                    <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500 mx-auto'></div>
                    <p className='mt-4 text-gray-600'>Loading your agreement...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className='min-h-screen flex items-center justify-center' style={{ background: 'linear-gradient(135deg, #f0f2f5 0%, #e8ecf1 50%, #dfe3e8 100%)' }}>
                <div className='bg-white p-8 rounded-lg shadow-lg max-w-md text-center'>
                    <svg className='w-16 h-16 text-red-500 mx-auto mb-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                    </svg>
                    <h2 className='text-2xl font-bold text-gray-800 mb-2'>No Form Found</h2>
                    <p className='text-gray-600 mb-4'>{error}</p>
                    <button onClick={() => router.push('/dashboard')} className='px-6 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600'>Go to Dashboard</button>
                </div>
            </div>
        );
    }

    const status = formData?.overallStatus || 'pending';
    const rejectionReason = formData?.rejectionReason;
    const contract = formData?.contractAgreement;
    const signedDate = new Date(contract?.signedDate || contract?.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <section className='min-h-screen' style={{ background: 'linear-gradient(135deg, #f0f2f5 0%, #e8ecf1 50%, #dfe3e8 100%)' }}>
            {/* Header Bar */}
            <div style={{
                background: '#ffffff',
                borderBottom: '1px solid #e2e8f0',
                padding: '12px 0',
                position: 'sticky',
                top: 0,
                zIndex: 40,
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
                <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <Image src="/images/logo.svg" width={200} height={300} style={{ width: '80px', height: 'auto' }} alt="Logo" />
                        {/* Status badge */}
                        <div style={{
                            padding: '4px 14px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: '700',
                            fontFamily: "'Inter', sans-serif",
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            background: status === 'approved' ? '#dcfce7' : status === 'rejected' ? '#fee2e2' : '#fef3c7',
                            color: status === 'approved' ? '#166534' : status === 'rejected' ? '#991b1b' : '#92400e',
                            border: `1px solid ${status === 'approved' ? '#86efac' : status === 'rejected' ? '#fca5a5' : '#fcd34d'}`
                        }}>
                            {status}
                        </div>
                    </div>
                    <button onClick={() => router.push('/dashboard')} style={{ padding: '8px 24px', fontSize: '13px', fontWeight: '700', fontFamily: "'Inter', sans-serif", color: '#475569', background: '#e2e8f0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Back to Dashboard</button>
                </div>
            </div>

            {/* Status Banner */}
            {status === 'pending' && (
                <div style={{ maxWidth: '860px', margin: '20px auto 0', padding: '0 20px' }}>
                    <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '8px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <svg style={{ width: '20px', height: '20px', color: '#f59e0b', flexShrink: 0 }} fill='currentColor' viewBox='0 0 20 20'>
                            <path fillRule='evenodd' d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z' clipRule='evenodd' />
                        </svg>
                        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#92400e' }}>Your application is currently under review. We&apos;ll notify you via email once a decision has been made.</p>
                    </div>
                </div>
            )}
            {status === 'approved' && (
                <div style={{ maxWidth: '860px', margin: '20px auto 0', padding: '0 20px' }}>
                    <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <svg style={{ width: '20px', height: '20px', color: '#16a34a', flexShrink: 0 }} fill='currentColor' viewBox='0 0 20 20'>
                            <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                        </svg>
                        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#166534' }}>Congratulations! Your application has been approved. You now have full access to all DJ features.</p>
                    </div>
                </div>
            )}
            {status === 'rejected' && (
                <div style={{ maxWidth: '860px', margin: '20px auto 0', padding: '0 20px' }}>
                    <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <svg style={{ width: '20px', height: '20px', color: '#dc2626', flexShrink: 0 }} fill='currentColor' viewBox='0 0 20 20'>
                                <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z' clipRule='evenodd' />
                            </svg>
                            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: '700', color: '#991b1b' }}>Application Rejected</p>
                        </div>
                        {rejectionReason && (
                            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#b91c1c', paddingLeft: '32px' }}>
                                <strong>Reason:</strong> {rejectionReason}
                            </p>
                        )}
                        {!isEditing && (
                            <div style={{ paddingLeft: '32px', marginTop: '12px' }}>
                                <button
                                    onClick={handleEdit}
                                    style={{
                                        padding: '8px 24px',
                                        fontSize: '13px',
                                        fontWeight: '700',
                                        fontFamily: "'Inter', sans-serif",
                                        color: '#fff',
                                        background: 'linear-gradient(135deg, #4338ca, #6366f1)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 8px rgba(67,56,202,0.3)'
                                    }}
                                >
                                    ✎ Edit & Resubmit Agreement
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Document Container — EXACT SAME as dj-forms/page.jsx */}
            <div style={{ maxWidth: '860px', margin: '40px auto', padding: '0 20px 80px' }}>
                <div style={{
                    background: '#ffffff',
                    borderRadius: '2px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
                    padding: '60px 72px',
                    fontFamily: "'Georgia', 'Times New Roman', serif",
                    color: '#1a1a2e',
                    lineHeight: '1.75',
                    position: 'relative',
                    opacity: status === 'approved' ? 1 : undefined
                }}>
                    {/* Decorative top line */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #4338ca, #6366f1, #818cf8)' }} />

                    {/* Document Title */}
                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <h1 style={{ fontSize: '26px', fontWeight: '700', fontFamily: "'Inter', 'Helvetica Neue', sans-serif", color: '#1a1a2e', letterSpacing: '-0.02em', lineHeight: '1.3', marginBottom: '8px' }}>
                            VOLUNTEER INDEPENDENT CONTRACTOR AGREEMENT
                        </h1>
                        <div style={{ width: '80px', height: '3px', background: 'linear-gradient(90deg, #4338ca, #6366f1)', margin: '16px auto 0', borderRadius: '2px' }} />
                    </div>

                    {/* Important Notice */}
                    <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderLeft: '4px solid #f59e0b', borderRadius: '6px', padding: '20px 24px', marginBottom: '36px' }}>
                        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: '700', color: '#92400e', marginBottom: '8px', letterSpacing: '0.02em' }}>IMPORTANT NOTICE:</p>
                        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#78350f', lineHeight: '1.7' }}>
                            This Agreement does not create employment. Contractor provides all services voluntarily, motivated by love for God and the ministry. No compensation is owed now or at any time unless the Company chooses to offer payment under a separate independent contractor agreement (1099).
                        </p>
                    </div>

                    {/* All 14 Sections */}
                    <AgreementSection number="1" title="PURPOSE OF AGREEMENT">
                        <AgreementItem number="1.1">Company is in a development and expansion phase and is not yet consistently generating profit.</AgreementItem>
                        <AgreementItem number="1.2">Contractor agrees to provide <strong>voluntary services</strong> in support of the Company&apos;s mission.</AgreementItem>
                        <AgreementItem number="1.3">All services provided under this Agreement are unpaid, voluntary, and given freely as an expression of commitment to God and the ministry.</AgreementItem>
                        <AgreementItem number="1.4">Contractor acknowledges that participation is motivated by love for God and the ministry, and Contractor <strong>will not seek compensation now or in the future</strong>.</AgreementItem>
                    </AgreementSection>

                    <AgreementSection number="2" title="VOLUNTEER STATUS – NO COMPENSATION">
                        <AgreementItem number="2.1">Contractor acknowledges and agrees:</AgreementItem>
                        <ul style={{ paddingLeft: '36px', marginTop: '4px', marginBottom: '8px' }}>
                            <li style={{ marginBottom: '6px', fontSize: '14px' }}>No wages, salary, commissions, bonuses, stipends, equity, deferred compensation, royalties, or financial compensation are owed at any time under this Agreement.</li>
                            <li style={{ fontSize: '14px' }}>No benefits, insurance, retirement contributions, or employee protections apply.</li>
                        </ul>
                        <AgreementItem number="2.2">This Agreement does not create employment, partnership, joint venture ownership, agency authority, or equity interest.</AgreementItem>
                        <AgreementItem number="2.3">Any future paid position requires a separate written agreement signed by both parties.</AgreementItem>
                    </AgreementSection>

                    <AgreementSection number="3" title="FUTURE COMPENSATION & OPTIONAL CONTRACTOR AGREEMENT">
                        <AgreementItem number="3.1">Contractor acknowledges that no compensation of any kind shall be owed, accrued, vested, or implied under this Agreement.</AgreementItem>
                        <AgreementItem number="3.2">Any future compensation, if offered, including but not limited to wages, stipends, bonuses, tip-sharing programs, milestone incentives, profit participation, or longevity rewards, shall only occur if:</AgreementItem>
                        <div style={{ paddingLeft: '36px', marginBottom: '8px' }}>
                            <p style={{ fontSize: '14px', marginBottom: '4px' }}>(a) The Company chooses to offer compensation;</p>
                            <p style={{ fontSize: '14px', marginBottom: '4px' }}>(b) A separate written agreement is executed by both parties, clearly defining the terms;</p>
                            <p style={{ fontSize: '14px' }}>(c) The Contractor is engaged as an <strong>independent contractor under IRS-compliant 1099 terms</strong>.</p>
                        </div>
                        <AgreementItem number="3.3">The Company makes no representations, warranties, or guarantees regarding if or when compensation may be offered.</AgreementItem>
                        <AgreementItem number="3.4">No bonuses, milestone incentives, or service-based rewards accrue under this Agreement.</AgreementItem>
                        <AgreementItem number="3.5">Any future compensation program shall be governed exclusively by a separate written agreement defining eligibility, vesting, payout schedules, installment terms, forfeiture conditions, and compliance requirements.</AgreementItem>
                        <AgreementItem number="3.6">The Company is not obligated to offer compensation at any time.</AgreementItem>
                    </AgreementSection>

                    <AgreementSection number="4" title="ROLE FLEXIBILITY">
                        <AgreementItem number="4.1">Contractor may assist in various operational areas.</AgreementItem>
                        <AgreementItem number="4.2">Responsibilities may change as organizational needs evolve.</AgreementItem>
                        <AgreementItem number="4.3">No guaranteed position, title, or long-term role is promised.</AgreementItem>
                    </AgreementSection>

                    <AgreementSection number="5" title="FAITH-BASED MISSION ACKNOWLEDGMENT">
                        <AgreementItem number="5.1">Company operates as a Christian faith-based organization.</AgreementItem>
                        <AgreementItem number="5.2">Participation is voluntary, given freely as an act of service to God and the ministry.</AgreementItem>
                        <AgreementItem number="5.3">This Agreement is not employment but voluntary ministry service.</AgreementItem>
                    </AgreementSection>

                    <AgreementSection number="6" title="TERMINATION">
                        <AgreementItem number="6.1">Either party may discontinue participation at any time, with or without cause.</AgreementItem>
                    </AgreementSection>

                    <AgreementSection number="7" title="DISPUTE RESOLUTION – MULTI-STATE & INTERNATIONAL">
                        <AgreementItem number="7.1">Disputes shall be resolved through binding arbitration in the jurisdiction where the Company is registered at the time of dispute.</AgreementItem>
                        <AgreementItem number="7.2">This Agreement shall be governed by the laws of the state or country where the Company is registered.</AgreementItem>
                        <AgreementItem number="7.3">If arbitration is unenforceable in a jurisdiction, disputes shall proceed in a court selected by the Company.</AgreementItem>
                        <AgreementItem number="7.4">Each party shall bear its own legal costs unless otherwise ordered.</AgreementItem>
                    </AgreementSection>

                    <AgreementSection number="8" title="VOLUNTEER RELEASE & LIABILITY WAIVER">
                        <AgreementItem number="8.1">Contractor voluntarily assumes all risks associated with participation.</AgreementItem>
                        <AgreementItem number="8.2">Contractor releases and discharges Company from any claims arising from participation under this Agreement to the fullest extent permitted by law.</AgreementItem>
                        <AgreementItem number="8.3">No workers&apos; compensation or employment protections apply.</AgreementItem>
                        <AgreementItem number="8.4">Contractor is responsible for personal medical coverage.</AgreementItem>
                        <AgreementItem number="8.5">Contractor agrees to indemnify and hold harmless the Company from claims resulting from negligent, unlawful, or unauthorized acts.</AgreementItem>
                    </AgreementSection>

                    <AgreementSection number="9" title="CONFIDENTIALITY & NON-DISCLOSURE">
                        <AgreementItem number="9.1">Contractor shall maintain strict confidentiality regarding all non-public information, including business strategies, financial data, donor info, listener data, technology, marketing strategies, partnerships, operational systems, and ministry communications.</AgreementItem>
                        <AgreementItem number="9.2">Confidential information may not be disclosed, shared, copied, recorded, or used for personal benefit without written authorization.</AgreementItem>
                        <AgreementItem number="9.3">These obligations survive termination indefinitely.</AgreementItem>
                    </AgreementSection>

                    <AgreementSection number="10" title="INTELLECTUAL PROPERTY OWNERSHIP">
                        <AgreementItem number="10.1">All works created during volunteer service (audio, broadcasts, scripts, branding, logos, graphics, social media content, software, production materials, marketing campaigns, written works, creative concepts) are &quot;work made for hire&quot; and owned exclusively by the Company worldwide.</AgreementItem>
                        <AgreementItem number="10.2">Contractor irrevocably assigns any rights and waives moral rights to the fullest extent permitted by law.</AgreementItem>
                    </AgreementSection>

                    <AgreementSection number="11" title="LIMITATION OF LIABILITY & NO IMPLIED OBLIGATIONS">
                        <AgreementItem number="11.1">No verbal statements, projections, spiritual affirmations, or informal discussions create enforceable promises.</AgreementItem>
                        <AgreementItem number="11.2">Matters not expressly in this Agreement do not create liability against the Company, affiliates, or associated persons.</AgreementItem>
                        <AgreementItem number="11.3">Company is not liable for indirect, consequential, speculative, or expectation-based damages.</AgreementItem>
                        <AgreementItem number="11.4">Nothing protects against fraud, intentional misconduct, or mandatory law violations.</AgreementItem>
                    </AgreementSection>

                    <AgreementSection number="12" title="GLOBAL SEVERABILITY & ENFORCEABILITY">
                        <AgreementItem number="12.1">If any provision is unenforceable, it shall be modified minimally while remainder stays valid worldwide.</AgreementItem>
                        <AgreementItem number="12.2">Agreement is intended to be enforceable globally to the maximum extent permitted.</AgreementItem>
                    </AgreementSection>

                    <AgreementSection number="13" title="NON-COMPETE & NON-SOLICITATION">
                        <AgreementItem number="13.1">Contractor shall not, during participation and for 12 months after termination (where enforceable), operate, assist, or create a competing gospel media/digital platform using Company confidential information.</AgreementItem>
                        <AgreementItem number="13.2">Contractor shall not solicit donors, listeners, partners, volunteers, contractors, or staff for 24 months post-termination.</AgreementItem>
                        <AgreementItem number="13.3">In jurisdictions restricting non-competes, this section defaults to maximum enforceable non-solicitation protection.</AgreementItem>
                        <AgreementItem number="13.4">Company may seek injunctive or equitable relief for violations.</AgreementItem>
                    </AgreementSection>

                    <AgreementSection number="14" title="ENTIRE AGREEMENT">
                        <p style={{ fontSize: '14px', paddingLeft: '12px' }}>
                            This Agreement supersedes all prior discussions. Amendments must be in writing and signed.
                        </p>
                    </AgreementSection>

                    {/* Divider before signatures */}
                    <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, #cbd5e1, transparent)', margin: '48px 0 40px' }} />

                    {/* SIGNATURES */}
                    <div style={{ fontFamily: "'Inter', sans-serif" }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', textAlign: 'center', color: '#1a1a2e', letterSpacing: '0.1em', marginBottom: '32px' }}>
                            SIGNATURES
                        </h2>

                        {/* Company Representative */}
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '28px 32px', marginBottom: '24px', background: '#f8fafc' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#4338ca', marginBottom: '16px', letterSpacing: '0.01em' }}>
                                Company Representative
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <p style={{ fontSize: '14px', color: '#334155' }}><strong>Name:</strong> Gregory Franklin</p>
                                <p style={{ fontSize: '14px', color: '#334155' }}><strong>Title:</strong> CEO</p>
                                <p style={{ fontSize: '14px', color: '#334155' }}>
                                    <strong>Signature:</strong>{' '}
                                    <em style={{ fontFamily: "'Georgia', serif", color: '#4338ca' }}>Gregory Franklin</em>
                                </p>
                                <p style={{ fontSize: '14px', color: '#334155' }}>
                                    <strong>Date:</strong>{' '}
                                    <span style={{ background: '#e0e7ff', padding: '2px 8px', borderRadius: '4px', color: '#4338ca', fontWeight: '600' }}>{signedDate}</span>
                                </p>
                            </div>
                        </div>

                        {/* Contractor Section */}
                        <div style={{ border: '2px solid #4338ca', borderRadius: '10px', padding: '28px 32px', background: '#fafbff' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#4338ca', marginBottom: '20px', letterSpacing: '0.01em' }}>
                                Contractor
                            </h3>

                            {/* Name */}
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
                                    Name {isEditing && <span style={{ color: '#ef4444' }}>*</span>}
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        placeholder="Enter your full name"
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '8px',
                                            fontSize: '15px',
                                            fontFamily: "'Inter', sans-serif",
                                            color: '#1e293b',
                                            background: '#f1f5f9',
                                            outline: 'none',
                                            boxSizing: 'border-box'
                                        }}
                                        onFocus={(e) => { e.target.style.borderColor = '#4338ca'; e.target.style.boxShadow = '0 0 0 3px rgba(67,56,202,0.1)'; e.target.style.background = '#ffffff'; }}
                                        onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f1f5f9'; }}
                                    />
                                ) : (
                                    <div style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '8px',
                                        fontSize: '15px',
                                        fontFamily: "'Inter', sans-serif",
                                        color: '#1e293b',
                                        background: '#f1f5f9',
                                        boxSizing: 'border-box',
                                        minHeight: '45px'
                                    }}>
                                        {contract?.contractorName || '—'}
                                    </div>
                                )}
                            </div>

                            {/* Signature */}
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                                    Signature {isEditing && <span style={{ color: '#ef4444' }}>*</span>}
                                </label>
                                {isEditing ? (
                                    <>
                                        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                                            Draw your new signature below using your mouse or touch
                                        </p>
                                        <div style={{ position: 'relative' }}>
                                            <canvas
                                                ref={canvasRef}
                                                onMouseDown={startDrawing}
                                                onMouseMove={draw}
                                                onMouseUp={stopDrawing}
                                                onMouseLeave={stopDrawing}
                                                onTouchStart={startDrawing}
                                                onTouchMove={draw}
                                                onTouchEnd={stopDrawing}
                                                style={{
                                                    width: '100%',
                                                    height: '160px',
                                                    border: '2px dashed #cbd5e1',
                                                    borderRadius: '8px',
                                                    cursor: 'crosshair',
                                                    background: '#ffffff',
                                                    touchAction: 'none',
                                                    display: 'block'
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={clearCanvas}
                                                style={{
                                                    position: 'absolute',
                                                    top: '8px',
                                                    right: '8px',
                                                    padding: '5px 14px',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    fontFamily: "'Inter', sans-serif",
                                                    background: '#ef4444',
                                                    color: '#ffffff',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Clear
                                            </button>
                                        </div>
                                        {!hasDrawn && (
                                            <p style={{ fontSize: '12px', color: '#4338ca', marginTop: '6px', fontStyle: 'italic' }}>
                                                Please draw your signature above
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                                            Contractor&apos;s signature
                                        </p>
                                        <div style={{
                                            width: '100%',
                                            height: '160px',
                                            border: '2px dashed #cbd5e1',
                                            borderRadius: '8px',
                                            background: '#ffffff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            {contract?.contractorSignatureUrl ? (
                                                <img
                                                    src={contract.contractorSignatureUrl}
                                                    alt="Your Signature"
                                                    style={{ maxWidth: '100%', maxHeight: '150px', objectFit: 'contain' }}
                                                />
                                            ) : (
                                                <p style={{ fontSize: '14px', color: '#94a3b8', fontStyle: 'italic' }}>No signature</p>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Date */}
                            <p style={{ fontSize: '14px', color: '#334155' }}>
                                <strong>Date:</strong>{' '}
                                <span style={{ background: '#e0e7ff', padding: '2px 8px', borderRadius: '4px', color: '#4338ca', fontWeight: '600' }}>{signedDate}</span>
                            </p>
                        </div>

                        {/* Edit action buttons */}
                        {isEditing && (
                            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
                                <button
                                    onClick={handleResubmit}
                                    disabled={submitting}
                                    style={{
                                        padding: '14px 48px',
                                        fontSize: '15px',
                                        fontWeight: '700',
                                        fontFamily: "'Inter', sans-serif",
                                        color: '#ffffff',
                                        background: submitting ? '#94a3b8' : 'linear-gradient(135deg, #4338ca, #6366f1)',
                                        border: 'none',
                                        borderRadius: '12px',
                                        cursor: submitting ? 'not-allowed' : 'pointer',
                                        boxShadow: submitting ? 'none' : '0 4px 14px rgba(67,56,202,0.35)',
                                        letterSpacing: '0.02em'
                                    }}
                                >
                                    {submitting ? 'Resubmitting...' : '✓ Resubmit Agreement'}
                                </button>
                                <button
                                    onClick={handleCancelEdit}
                                    style={{
                                        padding: '14px 48px',
                                        fontSize: '15px',
                                        fontWeight: '700',
                                        fontFamily: "'Inter', sans-serif",
                                        color: '#475569',
                                        background: '#e2e8f0',
                                        border: 'none',
                                        borderRadius: '12px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MyFormStatus;
