import React from "react";

// em typescript, preciso tipar as propriedades que o componente pode receber
interface CardProps {
    title: string;
    total: number;
    titleColor?: string;
}

const CardEtapa: React.FC<CardProps> = ({ title, total, titleColor = "font-bold"}) => {
    return (
        <div className={`flex-col self-auto p-4 rounded-2xl ring border-2 w-40 justify-between items-center text-center bg-white`}>
            <h2 className={`${titleColor}`}>{title}</h2>
            <p className="justify-self-center">{total}</p>
        </div>
    )
}

export default CardEtapa;