"use client";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { MdOutlineSecurity, MdCheckCircle } from 'react-icons/md';

const errorText = (err) => err?.response?.data?.message || err.message || 'Something went wrong';

export default function SecurityPage() {
	const [enabled, setEnabled] = useState(null); // null while loading
	const [setup, setSetup] = useState(null); // { qr, secret, account, issuer }
	const [code, setCode] = useState('');
	const [disableCode, setDisableCode] = useState('');
	const [disablePassword, setDisablePassword] = useState('');
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		axios.get('/api/v1/two-factor')
			.then(({ data }) => setEnabled(!!data.enabled))
			.catch((err) => { setEnabled(false); toast.error(errorText(err)); });
	}, []);

	const startSetup = async () => {
		setBusy(true);
		try {
			const { data } = await axios.post('/api/v1/two-factor', { action: 'setup' });
			setSetup(data);
			setCode('');
		} catch (err) {
			toast.error(errorText(err));
		}
		setBusy(false);
	};

	const confirmSetup = async (e) => {
		e.preventDefault();
		setBusy(true);
		try {
			const { data } = await axios.post('/api/v1/two-factor', { action: 'enable', code });
			toast.success(data.message);
			setEnabled(true);
			setSetup(null);
			setCode('');
		} catch (err) {
			toast.error(errorText(err));
		}
		setBusy(false);
	};

	const turnOff = async (e) => {
		e.preventDefault();
		if (!window.confirm('Remove the authenticator app? You will log in with an emailed code again.')) return;
		setBusy(true);
		try {
			const { data } = await axios.post('/api/v1/two-factor', { action: 'disable', code: disableCode, password: disablePassword });
			toast.success(data.message);
			setEnabled(false);
			setDisableCode('');
			setDisablePassword('');
		} catch (err) {
			toast.error(errorText(err));
		}
		setBusy(false);
	};

	const codeInput = (value, onChange) => (
		<input
			type="text"
			inputMode="numeric"
			autoComplete="one-time-code"
			maxLength={6}
			value={value}
			onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
			placeholder="6-digit code"
			className="w-40 text-center tracking-[0.3em] text-xl border border-gray-300 rounded-md py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
		/>
	);

	return (
		<section className="w-full py-8 px-6 max-w-3xl">
			<div className="flex items-center gap-3 mb-2">
				<MdOutlineSecurity size={30} className="text-indigo-600" />
				<h1 className="text-2xl font-semibold text-gray-800">Login security</h1>
			</div>
			<p className="text-gray-600 mb-8">
				By default you log in with your password and a code sent to your email.
				You can connect an authenticator app instead, such as Google Authenticator, Microsoft Authenticator or Authy.
				The app shows a new 6-digit code every 30 seconds, and it works without email.
			</p>

			<div className="rounded-lg border border-gray-200 shadow-sm p-6">
				<div className="flex items-center justify-between gap-4 mb-4">
					<h2 className="text-lg font-semibold text-gray-800">Authenticator app</h2>
					{enabled === null ? (
						<span className="text-gray-400 text-sm">Checking…</span>
					) : enabled ? (
						<span className="flex items-center gap-1 text-green-700 text-sm font-medium"><MdCheckCircle size={18} /> Connected</span>
					) : (
						<span className="text-gray-500 text-sm">Not connected</span>
					)}
				</div>

				{enabled === false && !setup && (
					<button
						type="button"
						disabled={busy}
						onClick={startSetup}
						className="py-2 px-4 rounded-md bg-indigo-500 text-white hover:bg-indigo-700 disabled:opacity-50"
					>
						Connect authenticator app
					</button>
				)}

				{enabled === false && setup && (
					<form onSubmit={confirmSetup} className="flex flex-col gap-5">
						<ol className="list-decimal pl-5 text-gray-700 space-y-1">
							<li>Open your authenticator app and choose to add an account.</li>
							<li>Scan this QR code. If you cannot scan, enter the key below.</li>
							<li>Type the 6-digit code the app shows, then press Confirm.</li>
						</ol>
						<div className="flex flex-wrap items-center gap-6">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img src={setup.qr} alt="QR code for your authenticator app" width={220} height={220} className="border border-gray-200 rounded-md" />
							<div className="text-sm text-gray-600">
								<p className="mb-1">Account: <span className="font-medium text-gray-800">{setup.issuer} ({setup.account})</span></p>
								<p className="mb-1">Key:</p>
								<code className="block break-all bg-gray-100 rounded px-2 py-1 text-gray-800 select-all">{setup.secret.match(/.{1,4}/g).join(' ')}</code>
							</div>
						</div>
						<div className="flex items-center gap-3">
							{codeInput(code, setCode)}
							<button type="submit" disabled={busy || code.length !== 6} className="py-2 px-4 rounded-md bg-indigo-500 text-white hover:bg-indigo-700 disabled:opacity-50">Confirm</button>
							<button type="button" disabled={busy} onClick={() => setSetup(null)} className="py-2 px-4 rounded-md text-gray-600 hover:bg-gray-100">Cancel</button>
						</div>
					</form>
				)}

				{enabled === true && (
					<form onSubmit={turnOff} className="flex flex-col gap-3">
						<p className="text-gray-700">
							At login you will be asked for the code from your app.
							If you do not have your phone, the login screen can still email you a code.
						</p>
						<p className="text-gray-600 text-sm">To remove the app, enter a current code from it, or your password if you lost the phone.</p>
						<div className="flex flex-wrap items-center gap-3">
							{codeInput(disableCode, setDisableCode)}
							<span className="text-gray-400 text-sm">or</span>
							<input
								type="password"
								value={disablePassword}
								onChange={(e) => setDisablePassword(e.target.value)}
								placeholder="Password"
								autoComplete="current-password"
								className="border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
							/>
							<button type="submit" disabled={busy || (disableCode.length !== 6 && !disablePassword)} className="py-2 px-4 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">Remove app</button>
						</div>
					</form>
				)}
			</div>
		</section>
	);
}
