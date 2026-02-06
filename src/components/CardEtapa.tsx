import React from "react";

// em typescript, preciso tipar as propriedades que o componente pode receber
interface CardProps {
    title: string;
    total: number | string;
    titleColor?: string;
}

const CardEtapa: React.FC<CardProps> = ({ title, total, titleColor = "#000"}) => {
    return (
        <div className={`flex flex-col self-auto p-4 rounded-2xl ring border-2 w-40 text-center bg-gray-50 justify-around`}>
            <h2 style={{ color: titleColor}} className={"font-bold w-full text-center"}>{title}</h2>
            <p className="w-full text-center">{total}</p>
        </div>
    )
}

export default CardEtapa;