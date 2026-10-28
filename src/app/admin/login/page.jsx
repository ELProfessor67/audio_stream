"use client";
import LoginForm from "@/components/LoginForm";

// Station admin login, kept apart from the DJ login at /login (client request, Oct 26 2026).
export default function Page() {
    return <LoginForm variant="admin" />;
}
