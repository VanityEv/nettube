import React, { ReactElement, ReactNode } from 'react';

interface ConditionalWrapperProps {
  condition: boolean;
  wrapper: (children: ReactNode) => ReactElement;
  children: ReactNode;
}

export const ConditionalWrapper: React.FC<ConditionalWrapperProps> = ({ condition, wrapper, children }) =>
  condition ? wrapper(children) : <>{children}</>;
