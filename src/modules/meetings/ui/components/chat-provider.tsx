'use client'; 

import { authClient } from "@/lib/auth-client"; 
import { LoadingState } from "@/components/loading-state"; 
import { generateAvatarUri } from "@/lib/avatar"; 
import { ChatUI } from "./chat-ui"; 


interface Props {
    meetingId: string; 
    meetingName: string; 
}


export const ChatProvider = ({meetingId, meetingName}: Props) => {
    const { data, isPending } = authClient.useSession();  

    if (isPending || !data?.user) {
        return (
            <LoadingState
                title="Loading chat..."
                description="Please wait while we load the chat..."
            />
        )
    }

    return (
        <ChatUI 
            meetingId={meetingId}
            meetingName={meetingName}
            userId={data.user.id}
            userName={data.user.name}
            userImage={data.user.image ?? generateAvatarUri({seed: data.user.name, variant: "initials"})}
        />
    )
}