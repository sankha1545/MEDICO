import { ReactNode } from 'react';
import { DoctorNavbar } from './navbar';
import { DoctorFooter} from  './footer';
import { PageTransition } from '../../animations/Transitions';

interface LayoutProps {
  children: ReactNode;
  fullWidth?: boolean;
}

export const Layout1 = ({ children, fullWidth = false }: LayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      <DoctorNavbar />
      <main className="flex-grow pt-16">
        <PageTransition>
          {fullWidth ? (
            children
          ) : (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </div>
          )}
        </PageTransition>
      </main>
     <DoctorFooter />
    </div>
  );
};