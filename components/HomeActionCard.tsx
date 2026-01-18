
import React from 'react';

interface HomeActionCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    buttonText: string;
    onClick: () => void;
    theme: 'primary' | 'accent';
}

export const HomeActionCard: React.FC<HomeActionCardProps> = ({ icon, title, description, buttonText, onClick, theme }) => {
    const themeClasses = {
        primary: {
            title: 'text-primary-dark dark:text-dark-primary-dark',
            button: 'bg-primary dark:bg-dark-primary hover:bg-primary-dark dark:hover:bg-dark-primary-dark focus:ring-primary',
        },
        accent: {
            title: 'text-accent-dark dark:text-dark-accent-dark',
            button: 'bg-accent dark:bg-dark-accent hover:bg-accent-dark dark:hover:bg-dark-accent-dark focus:ring-accent',
        }
    };

    const classes = themeClasses[theme];

    return (
        <div className="flex flex-col items-center text-center p-6 bg-card dark:bg-dark-card rounded-xl shadow-lg border border-border dark:border-dark-border">
            {icon}
            <h3 className={`text-3xl font-display mt-4 ${classes.title}`}>{title}</h3>
            <p className="mt-2 text-text-secondary dark:text-dark-text-secondary h-16">{description}</p>
            <button
              onClick={onClick}
              className={`mt-6 px-10 py-3 text-lg font-semibold text-white transition-transform transform rounded-full shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 ${classes.button}`}
            >
              {buttonText}
            </button>
        </div>
    );
};
