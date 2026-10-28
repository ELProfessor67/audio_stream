"use client";
import LoginForm from "@/components/LoginForm";

// hgdjlive.com opens straight on the DJ login. The admin signs in at
// /admin/login; the client did not want an Admin/DJ switch here.
export default function Home() {
    return <LoginForm variant="dj" />;
}
