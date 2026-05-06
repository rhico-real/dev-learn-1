import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
} from 'react-router-dom';
import { clearSession, loadSession, restoreSession, saveSession } from '../auth';
import { AuthPage, MarketingPage } from '../pages/public';
import { AuthenticatedFeedPage } from '../pages/feed';
import {
    CreateEventPage,
    CreateRacePage,
    MerchComingSoonPage,
    OrganizerEventDetailPage,
    OrganizerEventsPage,
} from '../pages/organizer';

function ShellRouter({ session, handleSessionChange, handleLogout }) {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={
                        session ? (
                            <AuthenticatedFeedPage
                                session={session}
                                onLogout={handleLogout}
                            />
                        ) : (
                            <MarketingPage session={session} />
                        )
                    }
                />
                <Route
                    path="/login"
                    element={
                        session ? (
                            <Navigate to="/" replace />
                        ) : (
                            <AuthPage
                                mode="login"
                                eyebrow="Access your account"
                                title="Login to RunHop"
                                description="Review registrations, follow race updates, and step into the social side of serious running."
                                buttonLabel="Sign in"
                                fields={['email', 'password']}
                                altLinkLabel="Need an account?"
                                altLinkTo="/register"
                                altLinkAction="Create one"
                                onSessionChange={handleSessionChange}
                            />
                        )
                    }
                />
                <Route
                    path="/register"
                    element={
                        session ? (
                            <Navigate to="/" replace />
                        ) : (
                            <AuthPage
                                mode="register"
                                eyebrow="Create your account"
                                title="Register for RunHop"
                                description="Join the platform where race discovery, premium event presentation, and serious community start from one account."
                                buttonLabel="Create account"
                                fields={['displayName', 'email', 'password']}
                                altLinkLabel="Already registered?"
                                altLinkTo="/login"
                                altLinkAction="Login"
                                onSessionChange={handleSessionChange}
                            />
                        )
                    }
                />
                <Route
                    path="/create-race"
                    element={
                        session ? (
                            <Navigate to="/organizer/events" replace />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />
                <Route
                    path="/create-race/merch-coming-soon"
                    element={
                        session ? (
                            <Navigate to="/organizer/events" replace />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />
                <Route
                    path="/organizer/events"
                    element={
                        session ? (
                            <OrganizerEventsPage session={session} />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />
                <Route
                    path="/organizer/events/new"
                    element={
                        session ? (
                            <CreateEventPage session={session} />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />
                <Route
                    path="/organizer/events/:eventId"
                    element={
                        session ? (
                            <OrganizerEventDetailPage session={session} />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />
                <Route
                    path="/organizer/events/:eventId/races/new"
                    element={
                        session ? (
                            <CreateRacePage session={session} />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />
                <Route
                    path="/organizer/events/:eventId/races/merch-coming-soon"
                    element={
                        session ? (
                            <MerchComingSoonPage session={session} />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export function App() {
    const [session, setSession] = useState(() => loadSession());
    const [isSessionReady, setIsSessionReady] = useState(false);

    useEffect(() => {
        let isActive = true;

        async function bootSession() {
            try {
                const nextSession = await restoreSession();

                if (isActive) {
                    setSession(nextSession);
                }
            } catch {
                if (isActive) {
                    clearSession();
                    setSession(null);
                }
            } finally {
                if (isActive) {
                    setIsSessionReady(true);
                }
            }
        }

        bootSession();

        return () => {
            isActive = false;
        };
    }, []);

    const handleSessionChange = async (nextSession) => {
        const storedSession = saveSession(nextSession);

        if (!storedSession) {
            clearSession();
            setSession(null);
            setIsSessionReady(true);
            return;
        }

        setIsSessionReady(false);

        try {
            const restoredSession = await restoreSession(storedSession);
            setSession(restoredSession);
        } catch {
            clearSession();
            setSession(null);
        } finally {
            setIsSessionReady(true);
        }
    };

    const handleLogout = () => {
        clearSession();
        setSession(null);
        setIsSessionReady(true);
    };

    if (!isSessionReady) {
        return (
            <div className="app-boot">
                <div className="app-boot__panel">
                    <p className="feed-label">RunHop</p>
                    <h1>Checking your session.</h1>
                    <p>
                        Verifying account access through the current backend
                        token.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <ShellRouter
            handleLogout={handleLogout}
            handleSessionChange={handleSessionChange}
            session={session}
        />
    );
}

export function mountApp(rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
    );
}
