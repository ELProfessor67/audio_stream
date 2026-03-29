"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { showMessage, showError, clearMessage, clearError } from '@/utils/showAlert';

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

const FormRequests = () => {
    const [loading, setLoading] = useState(true);
    const [forms, setForms] = useState([]);
    const [filteredForms, setFilteredForms] = useState([]);
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedForm, setSelectedForm] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showDisapproveModal, setShowDisapproveModal] = useState(false);
    const [disapproveReason, setDisapproveReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [pagination, setPagination] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    const { isAuth, user } = useSelector(store => store.user);
    const router = useRouter();
    const dispatch = useDispatch();

    useEffect(() => {
        fetchForms();
    }, [isAuth, user, router, currentPage, statusFilter]);

    const fetchForms = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(`/api/v1/dj-forms/all?page=${currentPage}&status=${statusFilter}`);
            setForms(data.data.forms);
            setFilteredForms(data.data.forms);
            setPagination(data.data.pagination);
        } catch (err) {
            await dispatch(showError(err.response?.data?.message || 'Failed to fetch forms'));
            await dispatch(clearError());
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId, userName) => {
        const confirmed = window.confirm(`Are you sure you want to approve ${userName}'s application?`);
        if (!confirmed) return;
        try {
            setActionLoading(true);
            await axios.post('/api/v1/dj-forms/approve', { userId });
            await dispatch(showMessage('Form approved successfully! Email sent to the user.'));
            await dispatch(clearMessage());
            fetchForms();
        } catch (err) {
            await dispatch(showError(err.response?.data?.message || 'Failed to approve form'));
            await dispatch(clearError());
        } finally {
            setActionLoading(false);
        }
    };

    const handleDisapproveClick = (form) => {
        setSelectedForm(form);
        setDisapproveReason('');
        setShowDisapproveModal(true);
    };

    const handleDisapproveSubmit = async () => {
        if (!disapproveReason.trim()) {
            await dispatch(showError('Please provide a reason for disapproval'));
            await dispatch(clearError());
            return;
        }
        try {
            setActionLoading(true);
            await axios.post('/api/v1/dj-forms/disapprove', {
                userId: selectedForm.user._id,
                reason: disapproveReason
            });
            await dispatch(showMessage('Form rejected successfully! Email sent to the user.'));
            await dispatch(clearMessage());
            setShowDisapproveModal(false);
            setDisapproveReason('');
            fetchForms();
        } catch (err) {
            await dispatch(showError(err.response?.data?.message || 'Failed to disapprove form'));
            await dispatch(clearError());
        } finally {
            setActionLoading(false);
        }
    };

    const handleViewDetails = (form) => {
        setSelectedForm(form);
        setShowDetailsModal(true);
    };

    const getStatusBadge = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
                {status}
            </span>
        );
    };

    if (loading && forms.length === 0) {
        return (
            <div className='min-h-screen flex items-center justify-center bg-gray-50'>
                <div className='text-center'>
                    <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500 mx-auto'></div>
                    <p className='mt-4 text-gray-600'>Loading form requests...</p>
                </div>
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-gray-50 py-8'>
            <div className='container mx-auto px-4'>
                {/* Header */}
                <div className='bg-white rounded-lg shadow-lg p-6 mb-6'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <h1 className='text-3xl font-bold text-gray-800 mb-2'>DJ Form Requests</h1>
                            <p className='text-gray-600'>Review and manage DJ applications</p>
                        </div>
                        <Image src="/images/logo.svg" width={100} height={100} className='w-20' alt="Logo" />
                    </div>
                </div>

                {/* Filters */}
                <div className='bg-white rounded-lg shadow-lg p-4 mb-6'>
                    <div className='flex items-center gap-4'>
                        <label className='text-gray-700 font-semibold'>Filter by Status:</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                            className='px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                        >
                            <option value='all'>All</option>
                            <option value='pending'>Pending</option>
                            <option value='approved'>Approved</option>
                            <option value='rejected'>Rejected</option>
                        </select>
                        <div className='ml-auto text-gray-600'>
                            Total: {pagination?.totalCount || 0} forms
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className='bg-white rounded-lg shadow-lg overflow-hidden'>
                    <div className='overflow-x-auto'>
                        <table className='min-w-full divide-y divide-gray-200'>
                            <thead className='bg-gray-50'>
                                <tr>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>DJ Name</th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Email</th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Submitted Date</th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Status</th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Actions</th>
                                </tr>
                            </thead>
                            <tbody className='bg-white divide-y divide-gray-200'>
                                {filteredForms.length === 0 ? (
                                    <tr>
                                        <td colSpan='5' className='px-6 py-8 text-center text-gray-500'>No forms found</td>
                                    </tr>
                                ) : (
                                    filteredForms.map((form) => (
                                        <tr key={form._id} className='hover:bg-gray-50'>
                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                <div className='text-sm font-medium text-gray-900'>{form.user?.name}</div>
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                <div className='text-sm text-gray-500'>{form.user?.email}</div>
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                <div className='text-sm text-gray-500'>
                                                    {new Date(form.submittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </div>
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap'>{getStatusBadge(form.status)}</td>
                                            <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                                                <div className='flex gap-2'>
                                                    <button onClick={() => handleViewDetails(form)} className='text-indigo-600 hover:text-indigo-900'>View</button>
                                                    {form.status === 'pending' && (
                                                        <>
                                                            <button onClick={() => handleApprove(form.user._id, form.user.name)} disabled={actionLoading} className='text-green-600 hover:text-green-900 disabled:opacity-50'>Approve</button>
                                                            <button onClick={() => handleDisapproveClick(form)} disabled={actionLoading} className='text-red-600 hover:text-red-900 disabled:opacity-50'>Disapprove</button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className='bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200'>
                            <div className='text-sm text-gray-700'>Page {pagination.currentPage} of {pagination.totalPages}</div>
                            <div className='flex gap-2'>
                                <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className='px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'>Previous</button>
                                <button onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))} disabled={currentPage === pagination.totalPages} className='px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'>Next</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ===== FULL-PAGE DETAILS MODAL ===== */}
                {showDetailsModal && selectedForm && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        zIndex: 50,
                        overflowY: 'auto',
                        backdropFilter: 'blur(4px)'
                    }}>
                        {/* Same background as DJ form page */}
                        <div style={{ background: 'linear-gradient(135deg, #f0f2f5 0%, #e8ecf1 50%, #dfe3e8 100%)', minHeight: '100%' }}>
                            {/* Sticky header with close + actions */}
                            <div style={{
                                background: '#ffffff',
                                borderBottom: '1px solid #e2e8f0',
                                padding: '12px 0',
                                position: 'sticky',
                                top: 0,
                                zIndex: 60,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                            }}>
                                <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <Image src="/images/logo.svg" width={200} height={300} style={{ width: '80px', height: 'auto' }} alt="Logo" />
                                        <div style={{
                                            padding: '4px 14px',
                                            borderRadius: '20px',
                                            fontSize: '11px',
                                            fontWeight: '700',
                                            fontFamily: "'Inter', sans-serif",
                                            letterSpacing: '0.05em',
                                            textTransform: 'uppercase',
                                            background: selectedForm.status === 'approved' ? '#dcfce7' : selectedForm.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                                            color: selectedForm.status === 'approved' ? '#166534' : selectedForm.status === 'rejected' ? '#991b1b' : '#92400e',
                                            border: `1px solid ${selectedForm.status === 'approved' ? '#86efac' : selectedForm.status === 'rejected' ? '#fca5a5' : '#fcd34d'}`
                                        }}>
                                            {selectedForm.status}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <button onClick={() => { setShowDetailsModal(false); handleApprove(selectedForm.user._id, selectedForm.user.name); }} disabled={actionLoading} style={{ padding: '8px 24px', fontSize: '13px', fontWeight: '700', fontFamily: "'Inter', sans-serif", color: '#fff', background: '#16a34a', border: 'none', borderRadius: '8px', cursor: 'pointer', opacity: actionLoading ? 0.5 : 1 }}>Approve</button>
                                        <button onClick={() => { setShowDetailsModal(false); handleDisapproveClick(selectedForm); }} disabled={actionLoading} style={{ padding: '8px 24px', fontSize: '13px', fontWeight: '700', fontFamily: "'Inter', sans-serif", color: '#fff', background: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer', opacity: actionLoading ? 0.5 : 1 }}>Reject</button>
                                        <button onClick={() => setShowDetailsModal(false)} style={{ padding: '8px 24px', fontSize: '13px', fontWeight: '700', fontFamily: "'Inter', sans-serif", color: '#475569', background: '#e2e8f0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Close</button>
                                    </div>
                                </div>
                            </div>

                            {/* Document — EXACT SAME as dj-forms/page.jsx */}
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
                                        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: '700', color: '#92400e', marginBottom: '8px', letterSpacing: '0.02em' }}>
                                            IMPORTANT NOTICE:
                                        </p>
                                        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#78350f', lineHeight: '1.7' }}>
                                            This Agreement does not create employment. Contractor provides all services voluntarily, motivated by love for God and the ministry. No compensation is owed now or at any time unless the Company chooses to offer payment under a separate independent contractor agreement (1099).
                                        </p>
                                    </div>

                                    {/* All 14 Sections — Identical to DJ form */}
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

                                    {/* SIGNATURES — same layout as DJ form */}
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
                                                    <span style={{ background: '#e0e7ff', padding: '2px 8px', borderRadius: '4px', color: '#4338ca', fontWeight: '600' }}>
                                                        {new Date(selectedForm.contractAgreement?.signedDate || selectedForm.submittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Contractor — shows the submitted data */}
                                        <div style={{ border: '2px solid #4338ca', borderRadius: '10px', padding: '28px 32px', background: '#fafbff' }}>
                                            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#4338ca', marginBottom: '20px', letterSpacing: '0.01em' }}>
                                                Contractor
                                            </h3>

                                            {/* Name — shown as filled value */}
                                            <div style={{ marginBottom: '24px' }}>
                                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
                                                    Name
                                                </label>
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
                                                    {selectedForm.contractAgreement?.contractorName || selectedForm.executiveLegalForm?.fullName || selectedForm.user?.name || '—'}
                                                </div>
                                            </div>

                                            {/* Signature — shown as image or empty */}
                                            <div style={{ marginBottom: '24px' }}>
                                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                                                    Signature
                                                </label>
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
                                                    {selectedForm.contractAgreement?.contractorSignatureUrl ? (
                                                        <img
                                                            src={selectedForm.contractAgreement.contractorSignatureUrl}
                                                            alt="Contractor Signature"
                                                            style={{ maxWidth: '100%', maxHeight: '150px', objectFit: 'contain' }}
                                                        />
                                                    ) : selectedForm.executiveLegalForm?.digitalSignature ? (
                                                        <p style={{ fontSize: '28px', fontFamily: "'Georgia', serif", fontStyle: 'italic', color: '#1a1a2e' }}>
                                                            {selectedForm.executiveLegalForm.digitalSignature}
                                                        </p>
                                                    ) : (
                                                        <p style={{ fontSize: '14px', color: '#94a3b8', fontStyle: 'italic' }}>No signature</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Date */}
                                            <p style={{ fontSize: '14px', color: '#334155' }}>
                                                <strong>Date:</strong>{' '}
                                                <span style={{ background: '#e0e7ff', padding: '2px 8px', borderRadius: '4px', color: '#4338ca', fontWeight: '600' }}>
                                                    {new Date(selectedForm.contractAgreement?.signedDate || selectedForm.submittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Rejection reason */}
                                    {selectedForm.status === 'rejected' && selectedForm.rejectionReason && (
                                        <div style={{ marginTop: '40px', background: '#fef2f2', border: '2px solid #fca5a5', borderRadius: '8px', padding: '20px 24px' }}>
                                            <h4 style={{ fontFamily: "'Inter', sans-serif", fontWeight: '800', color: '#991b1b', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Rejection Reason</h4>
                                            <p style={{ fontFamily: "'Inter', sans-serif", color: '#b91c1c', fontSize: '14px', lineHeight: '1.6' }}>{selectedForm.rejectionReason}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Bottom Action Buttons — Always visible */}
                                <div style={{
                                    marginTop: '32px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    gap: '16px',
                                    flexWrap: 'wrap'
                                }}>
                                    <button
                                        onClick={() => { setShowDetailsModal(false); handleApprove(selectedForm.user._id, selectedForm.user.name); }}
                                        disabled={actionLoading}
                                        style={{
                                            padding: '14px 48px',
                                            fontSize: '15px',
                                            fontWeight: '700',
                                            fontFamily: "'Inter', sans-serif",
                                            color: '#ffffff',
                                            background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                                            border: 'none',
                                            borderRadius: '12px',
                                            cursor: actionLoading ? 'not-allowed' : 'pointer',
                                            opacity: actionLoading ? 0.5 : 1,
                                            boxShadow: '0 4px 14px rgba(22,163,74,0.35)',
                                            transition: 'all 0.2s',
                                            letterSpacing: '0.02em'
                                        }}
                                    >
                                        ✓ Approve Application
                                    </button>
                                    <button
                                        onClick={() => { setShowDetailsModal(false); handleDisapproveClick(selectedForm); }}
                                        disabled={actionLoading}
                                        style={{
                                            padding: '14px 48px',
                                            fontSize: '15px',
                                            fontWeight: '700',
                                            fontFamily: "'Inter', sans-serif",
                                            color: '#ffffff',
                                            background: 'linear-gradient(135deg, #dc2626, #ef4444)',
                                            border: 'none',
                                            borderRadius: '12px',
                                            cursor: actionLoading ? 'not-allowed' : 'pointer',
                                            opacity: actionLoading ? 0.5 : 1,
                                            boxShadow: '0 4px 14px rgba(220,38,38,0.35)',
                                            transition: 'all 0.2s',
                                            letterSpacing: '0.02em'
                                        }}
                                    >
                                        ✕ Reject Application
                                    </button>
                                </div>

                                {/* Footer text */}
                                <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: '#94a3b8', fontFamily: "'Inter', sans-serif" }}>
                                    Submitted by {selectedForm.user?.name} ({selectedForm.user?.email}) • {new Date(selectedForm.submittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Disapprove Modal */}
                {showDisapproveModal && selectedForm && (
                    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4' style={{ zIndex: 70 }}>
                        <div className='bg-white rounded-lg max-w-md w-full p-6'>
                            <h2 className='text-2xl font-bold text-gray-800 mb-4'>Disapprove Application</h2>
                            <p className='text-gray-600 mb-4'>
                                Please provide a reason for disapproving <strong>{selectedForm.user?.name}</strong>&apos;s application:
                            </p>
                            <textarea
                                value={disapproveReason}
                                onChange={(e) => setDisapproveReason(e.target.value)}
                                rows={4}
                                placeholder='Enter reason for disapproval...'
                                className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500'
                            />
                            <div className='mt-6 flex justify-end gap-3'>
                                <button onClick={() => { setShowDisapproveModal(false); setDisapproveReason(''); }} className='px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400'>Cancel</button>
                                <button onClick={handleDisapproveSubmit} disabled={actionLoading || !disapproveReason.trim()} className='px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50'>
                                    {actionLoading ? 'Processing...' : 'Submit Disapproval'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FormRequests;
