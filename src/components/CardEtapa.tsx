import React from "react";

// em typescript, preciso tipar as propriedades que o componente pode receber
interface CardProps {
    title: string;
    total: number;
    titleColor?: string;
}

const CardEtapa: React.FC<CardProps> = ({ title, total, titleColor = "font-bold text-blue"}) => {
    return (
        <div className={`flex-col self-auto p-4 rounded border-2 w-38 justify-center text-center`}>
            <h2 className={`${titleColor}`}>{title}</h2>
            <p>{total}</p>
        </div>
    )
}

export default CardEtapa;