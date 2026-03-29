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

const DJFormsPage = () => {
    const [loading, setLoading] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [contractorName, setContractorName] = useState('');
    const [hasDrawn, setHasDrawn] = useState(false);
    const { isAuth, user } = useSelector(store => store.user);
    const router = useRouter();
    const dispatch = useDispatch();

    // Canvas refs
    const canvasRef = useRef(null);
    const isDrawingRef = useRef(false);
    const lastPointRef = useRef(null);

    useEffect(() => {
        if (!isAuth || !user) {
            router.push('/login');
        } else if (!user.isDJ) {
            router.push('/dashboard');
        } else if (user.contractAgreement) {
            router.push('/dashboard');
        }
    }, [isAuth, user, router]);

    // Canvas setup
    useEffect(() => {
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
    }, []);

    const getPoint = useCallback((e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
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
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);
    };

    const getCanvasBlob = () => {
        return new Promise((resolve) => {
            const canvas = canvasRef.current;
            canvas.toBlob(resolve, 'image/png');
        });
    };

    const handleSubmit = async () => {
        if (!contractorName.trim()) {
            await dispatch(showError('Please enter your full name'));
            await dispatch(clearError());
            return;
        }
        if (!hasDrawn) {
            await dispatch(showError('Please draw your signature'));
            await dispatch(clearError());
            return;
        }

        setLoading(true);
        try {
            const blob = await getCanvasBlob();
            const signatureUrl = await uploadSignatureToCloudinary(blob);

            if (!signatureUrl) {
                await dispatch(showError('Failed to upload signature. Please try again.'));
                await dispatch(clearError());
                setLoading(false);
                return;
            }

            await axios.post('/api/v1/dj-forms/contract', {
                contractorName: contractorName.trim(),
                contractorSignatureUrl: signatureUrl
            });

            setShowSuccessPopup(true);
            setTimeout(() => {
                router.push('/dashboard');
            }, 3000);
        } catch (error) {
            await dispatch(showError(error.response?.data?.message || 'Failed to submit agreement'));
            await dispatch(clearError());
        }
        setLoading(false);
    };

    const todayFormatted = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    return (
        <section className='min-h-screen' style={{ background: 'linear-gradient(135deg, #f0f2f5 0%, #e8ecf1 50%, #dfe3e8 100%)' }}>
            {/* Header Bar */}
            <div style={{
                background: '#ffffff',
                borderBottom: '1px solid #e2e8f0',
                padding: '16px 0',
                position: 'sticky',
                top: 0,
                zIndex: 40,
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
                <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Image src="/images/logo.svg" width={200} height={300} style={{ width: '100px', height: 'auto' }} alt="Logo" />
                </div>
            </div>

            {/* Document Container */}
            <div style={{ maxWidth: '860px', margin: '40px auto', padding: '0 20px 80px' }}>
                <div style={{
                    background: '#ffffff',
                    borderRadius: '2px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
                    padding: '60px 72px',
                    fontFamily: "'Georgia', 'Times New Roman', serif",
                    color: '#1a1a2e',
                    lineHeight: '1.75',
                    position: 'relative'
                }}>
                    {/* Decorative top line */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: 'linear-gradient(90deg, #4338ca, #6366f1, #818cf8)'
                    }} />

                    {/* Document Title */}
                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <h1 style={{
                            fontSize: '26px',
                            fontWeight: '700',
                            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                            color: '#1a1a2e',
                            letterSpacing: '-0.02em',
                            lineHeight: '1.3',
                            marginBottom: '8px'
                        }}>
                            VOLUNTEER INDEPENDENT CONTRACTOR AGREEMENT
                        </h1>
                        <div style={{
                            width: '80px',
                            height: '3px',
                            background: 'linear-gradient(90deg, #4338ca, #6366f1)',
                            margin: '16px auto 0',
                            borderRadius: '2px'
                        }} />
                    </div>

                    {/* Important Notice */}
                    <div style={{
                        background: '#fef3c7',
                        border: '1px solid #f59e0b',
                        borderLeft: '4px solid #f59e0b',
                        borderRadius: '6px',
                        padding: '20px 24px',
                        marginBottom: '36px'
                    }}>
                        <p style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '14px',
                            fontWeight: '700',
                            color: '#92400e',
                            marginBottom: '8px',
                            letterSpacing: '0.02em'
                        }}>
                            IMPORTANT NOTICE:
                        </p>
                        <p style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '13px',
                            color: '#78350f',
                            lineHeight: '1.7'
                        }}>
                            This Agreement does not create employment. Contractor provides all services voluntarily, motivated by love for God and the ministry. No compensation is owed now or at any time unless the Company chooses to offer payment under a separate independent contractor agreement (1099).
                        </p>
                    </div>

                    {/* Section: Purpose */}
                    <AgreementSection number="1" title="PURPOSE OF AGREEMENT">
                        <AgreementItem number="1.1">Company is in a development and expansion phase and is not yet consistently generating profit.</AgreementItem>
                        <AgreementItem number="1.2">Contractor agrees to provide <strong>voluntary services</strong> in support of the Company's mission.</AgreementItem>
                        <AgreementItem number="1.3">All services provided under this Agreement are unpaid, voluntary, and given freely as an expression of commitment to God and the ministry.</AgreementItem>
                        <AgreementItem number="1.4">Contractor acknowledges that participation is motivated by love for God and the ministry, and Contractor <strong>will not seek compensation now or in the future</strong>.</AgreementItem>
                    </AgreementSection>

                    {/* Section 2 */}
                    <AgreementSection number="2" title="VOLUNTEER STATUS – NO COMPENSATION">
                        <AgreementItem number="2.1">Contractor acknowledges and agrees:</AgreementItem>
                        <ul style={{ paddingLeft: '36px', marginTop: '4px', marginBottom: '8px' }}>
                            <li style={{ marginBottom: '6px', fontSize: '14px' }}>No wages, salary, commissions, bonuses, stipends, equity, deferred compensation, royalties, or financial compensation are owed at any time under this Agreement.</li>
                            <li style={{ fontSize: '14px' }}>No benefits, insurance, retirement contributions, or employee protections apply.</li>
                        </ul>
                        <AgreementItem number="2.2">This Agreement does not create employment, partnership, joint venture ownership, agency authority, or equity interest.</AgreementItem>
                        <AgreementItem number="2.3">Any future paid position requires a separate written agreement signed by both parties.</AgreementItem>
                    </AgreementSection>

                    {/* Section 3 */}
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

                    {/* Section 4 */}
                    <AgreementSection number="4" title="ROLE FLEXIBILITY">
                        <AgreementItem number="4.1">Contractor may assist in various operational areas.</AgreementItem>
                        <AgreementItem number="4.2">Responsibilities may change as organizational needs evolve.</AgreementItem>
                        <AgreementItem number="4.3">No guaranteed position, title, or long-term role is promised.</AgreementItem>
                    </AgreementSection>

                    {/* Section 5 */}
                    <AgreementSection number="5" title="FAITH-BASED MISSION ACKNOWLEDGMENT">
                        <AgreementItem number="5.1">Company operates as a Christian faith-based organization.</AgreementItem>
                        <AgreementItem number="5.2">Participation is voluntary, given freely as an act of service to God and the ministry.</AgreementItem>
                        <AgreementItem number="5.3">This Agreement is not employment but voluntary ministry service.</AgreementItem>
                    </AgreementSection>

                    {/* Section 6 */}
                    <AgreementSection number="6" title="TERMINATION">
                        <AgreementItem number="6.1">Either party may discontinue participation at any time, with or without cause.</AgreementItem>
                    </AgreementSection>

                    {/* Section 7 */}
                    <AgreementSection number="7" title="DISPUTE RESOLUTION – MULTI-STATE & INTERNATIONAL">
                        <AgreementItem number="7.1">Disputes shall be resolved through binding arbitration in the jurisdiction where the Company is registered at the time of dispute.</AgreementItem>
                        <AgreementItem number="7.2">This Agreement shall be governed by the laws of the state or country where the Company is registered.</AgreementItem>
                        <AgreementItem number="7.3">If arbitration is unenforceable in a jurisdiction, disputes shall proceed in a court selected by the Company.</AgreementItem>
                        <AgreementItem number="7.4">Each party shall bear its own legal costs unless otherwise ordered.</AgreementItem>
                    </AgreementSection>

                    {/* Section 8 */}
                    <AgreementSection number="8" title="VOLUNTEER RELEASE & LIABILITY WAIVER">
                        <AgreementItem number="8.1">Contractor voluntarily assumes all risks associated with participation.</AgreementItem>
                        <AgreementItem number="8.2">Contractor releases and discharges Company from any claims arising from participation under this Agreement to the fullest extent permitted by law.</AgreementItem>
                        <AgreementItem number="8.3">No workers&apos; compensation or employment protections apply.</AgreementItem>
                        <AgreementItem number="8.4">Contractor is responsible for personal medical coverage.</AgreementItem>
                        <AgreementItem number="8.5">Contractor agrees to indemnify and hold harmless the Company from claims resulting from negligent, unlawful, or unauthorized acts.</AgreementItem>
                    </AgreementSection>

                    {/* Section 9 */}
                    <AgreementSection number="9" title="CONFIDENTIALITY & NON-DISCLOSURE">
                        <AgreementItem number="9.1">Contractor shall maintain strict confidentiality regarding all non-public information, including business strategies, financial data, donor info, listener data, technology, marketing strategies, partnerships, operational systems, and ministry communications.</AgreementItem>
                        <AgreementItem number="9.2">Confidential information may not be disclosed, shared, copied, recorded, or used for personal benefit without written authorization.</AgreementItem>
                        <AgreementItem number="9.3">These obligations survive termination indefinitely.</AgreementItem>
                    </AgreementSection>

                    {/* Section 10 */}
                    <AgreementSection number="10" title="INTELLECTUAL PROPERTY OWNERSHIP">
                        <AgreementItem number="10.1">All works created during volunteer service (audio, broadcasts, scripts, branding, logos, graphics, social media content, software, production materials, marketing campaigns, written works, creative concepts) are &quot;work made for hire&quot; and owned exclusively by the Company worldwide.</AgreementItem>
                        <AgreementItem number="10.2">Contractor irrevocably assigns any rights and waives moral rights to the fullest extent permitted by law.</AgreementItem>
                    </AgreementSection>

                    {/* Section 11 */}
                    <AgreementSection number="11" title="LIMITATION OF LIABILITY & NO IMPLIED OBLIGATIONS">
                        <AgreementItem number="11.1">No verbal statements, projections, spiritual affirmations, or informal discussions create enforceable promises.</AgreementItem>
                        <AgreementItem number="11.2">Matters not expressly in this Agreement do not create liability against the Company, affiliates, or associated persons.</AgreementItem>
                        <AgreementItem number="11.3">Company is not liable for indirect, consequential, speculative, or expectation-based damages.</AgreementItem>
                        <AgreementItem number="11.4">Nothing protects against fraud, intentional misconduct, or mandatory law violations.</AgreementItem>
                    </AgreementSection>

                    {/* Section 12 */}
                    <AgreementSection number="12" title="GLOBAL SEVERABILITY & ENFORCEABILITY">
                        <AgreementItem number="12.1">If any provision is unenforceable, it shall be modified minimally while remainder stays valid worldwide.</AgreementItem>
                        <AgreementItem number="12.2">Agreement is intended to be enforceable globally to the maximum extent permitted.</AgreementItem>
                    </AgreementSection>

                    {/* Section 13 */}
                    <AgreementSection number="13" title="NON-COMPETE & NON-SOLICITATION">
                        <AgreementItem number="13.1">Contractor shall not, during participation and for 12 months after termination (where enforceable), operate, assist, or create a competing gospel media/digital platform using Company confidential information.</AgreementItem>
                        <AgreementItem number="13.2">Contractor shall not solicit donors, listeners, partners, volunteers, contractors, or staff for 24 months post-termination.</AgreementItem>
                        <AgreementItem number="13.3">In jurisdictions restricting non-competes, this section defaults to maximum enforceable non-solicitation protection.</AgreementItem>
                        <AgreementItem number="13.4">Company may seek injunctive or equitable relief for violations.</AgreementItem>
                    </AgreementSection>

                    {/* Section 14 */}
                    <AgreementSection number="14" title="ENTIRE AGREEMENT">
                        <p style={{ fontSize: '14px', paddingLeft: '12px' }}>
                            This Agreement supersedes all prior discussions. Amendments must be in writing and signed.
                        </p>
                    </AgreementSection>

                    {/* Divider before signatures */}
                    <div style={{
                        height: '2px',
                        background: 'linear-gradient(90deg, transparent, #cbd5e1, transparent)',
                        margin: '48px 0 40px'
                    }} />

                    {/* SIGNATURES */}
                    <div style={{ fontFamily: "'Inter', sans-serif" }}>
                        <h2 style={{
                            fontSize: '20px',
                            fontWeight: '800',
                            textAlign: 'center',
                            color: '#1a1a2e',
                            letterSpacing: '0.1em',
                            marginBottom: '32px'
                        }}>
                            SIGNATURES
                        </h2>

                        {/* Company Representative */}
                        <div style={{
                            border: '1px solid #e2e8f0',
                            borderRadius: '10px',
                            padding: '28px 32px',
                            marginBottom: '24px',
                            background: '#f8fafc'
                        }}>
                            <h3 style={{
                                fontSize: '15px',
                                fontWeight: '700',
                                color: '#4338ca',
                                marginBottom: '16px',
                                letterSpacing: '0.01em'
                            }}>
                                Company Representative
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <p style={{ fontSize: '14px', color: '#334155' }}>
                                    <strong>Name:</strong> Gregory Franklin
                                </p>
                                <p style={{ fontSize: '14px', color: '#334155' }}>
                                    <strong>Title:</strong> CEO
                                </p>
                                <p style={{ fontSize: '14px', color: '#334155' }}>
                                    <strong>Signature:</strong>{' '}
                                    <em style={{ fontFamily: "'Georgia', serif", color: '#4338ca' }}>Gregory Franklin</em>
                                </p>
                                <p style={{ fontSize: '14px', color: '#334155' }}>
                                    <strong>Date:</strong>{' '}
                                    <span style={{
                                        background: '#e0e7ff',
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        color: '#4338ca',
                                        fontWeight: '600'
                                    }}>{todayFormatted}</span>
                                </p>
                            </div>
                        </div>

                        {/* Contractor Section */}
                        <div style={{
                            border: '2px solid #4338ca',
                            borderRadius: '10px',
                            padding: '28px 32px',
                            background: '#fafbff'
                        }}>
                            <h3 style={{
                                fontSize: '15px',
                                fontWeight: '700',
                                color: '#4338ca',
                                marginBottom: '20px',
                                letterSpacing: '0.01em'
                            }}>
                                Contractor
                            </h3>

                            {/* Name Input */}
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: '700',
                                    color: '#1e293b',
                                    marginBottom: '8px'
                                }}>
                                    Name <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={contractorName}
                                    onChange={(e) => setContractorName(e.target.value)}
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
                                        transition: 'all 0.2s ease',
                                        boxSizing: 'border-box'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#4338ca';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(67,56,202,0.1)';
                                        e.target.style.background = '#ffffff';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '#cbd5e1';
                                        e.target.style.boxShadow = 'none';
                                        e.target.style.background = '#f1f5f9';
                                    }}
                                />
                            </div>

                            {/* Signature Canvas */}
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: '700',
                                    color: '#1e293b',
                                    marginBottom: '4px'
                                }}>
                                    Signature <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <p style={{
                                    fontSize: '12px',
                                    color: '#64748b',
                                    marginBottom: '10px'
                                }}>
                                    Draw your signature below using your mouse or touch
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
                                            cursor: 'pointer',
                                            transition: 'background 0.2s',
                                            letterSpacing: '0.02em'
                                        }}
                                        onMouseOver={(e) => e.target.style.background = '#dc2626'}
                                        onMouseOut={(e) => e.target.style.background = '#ef4444'}
                                    >
                                        Clear
                                    </button>
                                </div>
                                {!hasDrawn && (
                                    <p style={{
                                        fontSize: '12px',
                                        color: '#4338ca',
                                        marginTop: '6px',
                                        fontStyle: 'italic'
                                    }}>
                                        Please draw your signature above
                                    </p>
                                )}
                            </div>

                            {/* Date */}
                            <p style={{ fontSize: '14px', color: '#334155' }}>
                                <strong>Date:</strong>{' '}
                                <span style={{
                                    background: '#e0e7ff',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    color: '#4338ca',
                                    fontWeight: '600'
                                }}>{todayFormatted}</span>
                            </p>
                        </div>

                        {/* Submit Button */}
                        <div style={{
                            marginTop: '40px',
                            textAlign: 'center'
                        }}>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                                style={{
                                    padding: '14px 56px',
                                    fontSize: '16px',
                                    fontWeight: '700',
                                    fontFamily: "'Inter', sans-serif",
                                    color: '#ffffff',
                                    background: loading
                                        ? '#94a3b8'
                                        : 'linear-gradient(135deg, #4338ca, #6366f1)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    boxShadow: loading
                                        ? 'none'
                                        : '0 4px 14px rgba(67,56,202,0.35)',
                                    letterSpacing: '0.02em',
                                    transform: 'translateY(0)'
                                }}
                                onMouseOver={(e) => {
                                    if (!loading) {
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 6px 20px rgba(67,56,202,0.45)';
                                    }
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = loading ? 'none' : '0 4px 14px rgba(67,56,202,0.35)';
                                }}
                            >
                                {loading ? (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <svg style={{ animation: 'spin 1s linear infinite', width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none">
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                                        </svg>
                                        Submitting Agreement...
                                    </span>
                                ) : 'Submit Agreement'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer text */}
                <p style={{
                    textAlign: 'center',
                    marginTop: '24px',
                    fontSize: '12px',
                    color: '#94a3b8',
                    fontFamily: "'Inter', sans-serif"
                }}>
                    This document is legally binding upon submission. Please review all terms carefully.
                </p>
            </div>

            {/* Spinner animation */}
            <style jsx>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @media (max-width: 768px) {
                    section > div:nth-child(2) > div:first-child {
                        padding: 32px 24px !important;
                    }
                }
            `}</style>

            {/* Success Popup */}
            {showSuccessPopup && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 50,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        background: '#ffffff',
                        borderRadius: '16px',
                        padding: '40px',
                        maxWidth: '420px',
                        margin: '0 16px',
                        textAlign: 'center',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                        animation: 'fadeInScale 0.3s ease'
                    }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #10b981, #34d399)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px'
                        }}>
                            <svg width="32" height="32" fill="none" stroke="#ffffff" strokeWidth="3" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 style={{
                            fontSize: '22px',
                            fontWeight: '800',
                            color: '#1e293b',
                            marginBottom: '8px',
                            fontFamily: "'Inter', sans-serif"
                        }}>
                            Agreement Submitted!
                        </h3>
                        <p style={{
                            color: '#64748b',
                            fontSize: '15px',
                            marginBottom: '12px',
                            fontFamily: "'Inter', sans-serif"
                        }}>
                            Your agreement has been submitted successfully. We will review and process it shortly.
                        </p>
                        <p style={{
                            color: '#94a3b8',
                            fontSize: '13px',
                            fontFamily: "'Inter', sans-serif"
                        }}>
                            Redirecting to dashboard...
                        </p>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes fadeInScale {
                    from {
                        opacity: 0;
                        transform: scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
            `}</style>
        </section>
    );
};

/* =====================================================
   REUSABLE AGREEMENT SUB-COMPONENTS
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

export default DJFormsPage;
