import { Navigate } from "react-router";
import { useApp } from "../context/AppContext";

export default function ConnectedPeerRedirect({ children }) {

    const { connectedPeer } = useApp();

    if (connectedPeer) {
        return <Navigate to="/workspace" replace />;
    }

    return children;
}