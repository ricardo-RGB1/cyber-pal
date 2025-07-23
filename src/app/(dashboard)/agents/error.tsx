'use client'; 

import { ErrorState } from "@/components/error-state"; 

const ErrorPage = () => {
    return <ErrorState title="Error loading agents" description="Something went wrong, please try again later" />
}

export default ErrorPage; 