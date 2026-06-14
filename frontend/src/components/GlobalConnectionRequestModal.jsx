import ConnectModal from "./ConnectModal";
import { useApp } from "../context/AppContext";

export default function GlobalConnectionRequestModal() {

    const {
        incomingRequest,
        acceptRequest,
        rejectRequest
    } = useApp();

    if (!incomingRequest) return null;

    return (
        <ConnectModal
            peer={{
                username: incomingRequest.requesterUsername
            }}

            title={`${incomingRequest.requesterUsername} wants to connect`}

            message={`Accept a direct P2P connection request from ${incomingRequest.requesterUsername}. Files will be shared end-to-end.`}

            confirmText="Accept"

            cancelText="Reject"

            onConfirm={() =>
                acceptRequest(
                    incomingRequest.requesterUserId
                )
            }

            onCancel={() =>
                rejectRequest(
                    incomingRequest.requesterUserId
                )
            }

        />
    );

}