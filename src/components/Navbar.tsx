
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Github, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface NavbarProps {
  transparent?: boolean;
}

const Navbar = ({ transparent = false }: NavbarProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className={`w-full z-50 ${transparent ? 'absolute top-0 left-0' : 'bg-background border-b'}`}>
      <div className="container-wide mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold text-saucy-500">Saucy</span>
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden sm:block">
            <div className="ml-10 flex items-center space-x-4">
              <Link 
                to="/features" 
                className="text-foreground/80 hover:text-foreground px-3 py-2 rounded-md text-sm font-medium"
              >
                Features
              </Link>
              <Link 
                to="/pricing" 
                className="text-foreground/80 hover:text-foreground px-3 py-2 rounded-md text-sm font-medium"
              >
                Pricing
              </Link>
              <Link 
                to="/docs" 
                className="text-foreground/80 hover:text-foreground px-3 py-2 rounded-md text-sm font-medium"
              >
                Documentation
              </Link>

              {user ? (
                <div className="flex items-center space-x-2">
                  <Button asChild variant="default">
                    <Link to="/dashboard">Dashboard</Link>
                  </Button>
                  <Button variant="outline" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button asChild>
                  <Link to="/auth">
                    <Github className="mr-2 h-4 w-4" />
                    Sign in with GitHub
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-foreground hover:bg-secondary focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`${
          isMobileMenuOpen ? 'block' : 'hidden'
        } sm:hidden bg-background border-b`}
      >
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link
            to="/features"
            className="text-foreground/80 hover:text-foreground block px-3 py-2 rounded-md text-base font-medium"
          >
            Features
          </Link>
          <Link
            to="/pricing"
            className="text-foreground/80 hover:text-foreground block px-3 py-2 rounded-md text-base font-medium"
          >
            Pricing
          </Link>
          <Link
            to="/docs"
            className="text-foreground/80 hover:text-foreground block px-3 py-2 rounded-md text-base font-medium"
          >
            Documentation
          </Link>
          
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="block w-full text-center bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-2 rounded-md text-base font-medium"
              >
                Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center justify-center w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground px-3 py-2 rounded-md text-base font-medium"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="flex items-center justify-center w-full bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-2 rounded-md text-base font-medium"
            >
              <Github className="mr-2 h-4 w-4" />
              Sign in with GitHub
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
