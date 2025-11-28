import React from 'react';
import { ExternalLink, DollarSign, CreditCard, Gift } from 'lucide-react';

interface CrowdfundingProject {
    id: string;
    name: string;
    tagline: string;
    fundingGoal: number;
    fundsRaised: number;
    cashtag?: string;
    paypalUrl?: string;
    imageUrl?: string;
}

interface CrowdfundingCardProps {
    project: CrowdfundingProject;
}

const CrowdfundingCard: React.FC<CrowdfundingCardProps> = ({ project }) => {
    const progress = Math.min((project.fundsRaised / project.fundingGoal) * 100, 100);

    return (
        <div className="card-glass overflow-hidden group">
            {/* Hero Image / Header */}
            <div className="h-32 bg-gradient-to-r from-indigo-900 to-purple-900 relative">
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute bottom-4 left-4">
                    <h3 className="text-xl font-bold text-white">{project.name}</h3>
                    <p className="text-sm text-indigo-200">{project.tagline}</p>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Progress Bar (The Public Window) */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Raised</span>
                        <span className="text-white font-medium">
                            ${project.fundsRaised.toLocaleString()} / ${project.fundingGoal.toLocaleString()}
                        </span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-1000"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-xs text-slate-500 text-right">{progress.toFixed(0)}% Funded</p>
                </div>

                {/* Coin Reward Teaser */}
                <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-lg p-3 flex items-center space-x-3">
                    <div className="p-2 bg-indigo-500/20 rounded-full">
                        <Gift className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-sm text-white font-medium">Get 100% Value Back</p>
                        <p className="text-xs text-slate-400">Donate $50 → Get 50 Store Coins</p>
                    </div>
                </div>

                {/* Payment Actions */}
                <div className="grid grid-cols-2 gap-3">
                    {project.cashtag && (
                        <a
                            href={`https://cash.app/${project.cashtag}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center space-x-2 py-2.5 bg-[#00D632]/10 hover:bg-[#00D632]/20 text-[#00D632] border border-[#00D632]/30 rounded-lg transition-colors font-medium"
                        >
                            <DollarSign className="w-4 h-4" />
                            <span>Cash App</span>
                        </a>
                    )}

                    {project.paypalUrl && (
                        <a
                            href={project.paypalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center space-x-2 py-2.5 bg-[#0070BA]/10 hover:bg-[#0070BA]/20 text-[#0070BA] border border-[#0070BA]/30 rounded-lg transition-colors font-medium"
                        >
                            <CreditCard className="w-4 h-4" />
                            <span>PayPal</span>
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CrowdfundingCard;
