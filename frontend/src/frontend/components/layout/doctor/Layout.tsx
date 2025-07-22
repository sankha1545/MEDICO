import { ReactNode } from 'react';
import  {DoctorNavbar}  from './navbar';
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
            <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
              {children}
            </div>
          )}
        </PageTransition>
      </main>
     <DoctorFooter />
    </div>
  );
};