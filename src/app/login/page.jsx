"use client";
import LoginForm from "@/components/LoginForm";

// DJ login. Every DJ already has this link; the admin signs in at /admin/login.
export default function Page() {
    return <LoginForm variant="dj" />;
}
