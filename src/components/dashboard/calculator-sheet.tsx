
"use client";

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calculator } from "lucide-react";
import { cn } from '@/lib/utils';

export function CalculatorSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void; }) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');

  const handleButtonClick = (value: string) => {
    if (value === '=') {
      try {
        // Using a safe eval alternative is recommended for production, 
        // but for this prototype, eval is sufficient.
        const evalResult = eval(input.replace('x', '*').replace('÷', '/'));
        setResult(String(evalResult));
        setInput(String(evalResult));
      } catch (error) {
        setResult('Error');
      }
    } else if (value === 'C') {
      setInput('');
      setResult('');
    } else {
      setInput(prev => prev + value);
    }
  };
  
  const buttons = [
    '7', '8', '9', '÷',
    '4', '5', '6', 'x',
    '1', '2', '3', '-',
    '0', '.', '=', '+',
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col w-full sm:max-w-xs">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Calculator /> Calculadora
          </SheetTitle>
          <SheetDescription>
            Una calculadora simple para operaciones rápidas.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col flex-1 justify-center gap-4">
          <div className="p-2 rounded-lg bg-muted text-right">
             <div className="text-sm text-muted-foreground break-all h-6">{input || '0'}</div>
             <div className="text-3xl font-bold break-all">{result || (input.endsWith('=') ? '' : input.split(/[+\-x÷]/).pop()) || '0'}</div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <Button
                variant="destructive"
                className="col-span-4 h-16 text-2xl"
                onClick={() => handleButtonClick('C')}
            >
              C
            </Button>
            {buttons.map((btn) => (
              <Button
                key={btn}
                variant={isNaN(Number(btn)) && btn !== '.' ? 'secondary' : 'outline'}
                className="h-16 text-2xl"
                onClick={() => handleButtonClick(btn)}
              >
                {btn}
              </Button>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
