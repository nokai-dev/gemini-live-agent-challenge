#!/usr/bin/env python3
"""
Hackathon Submission Audit Agent
Runs periodically to evaluate submission quality and originality
"""

import os
import sys
import json
import subprocess
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple

class HackathonAuditor:
    def __init__(self, repo_path: str = "."):
        self.repo_path = Path(repo_path)
        self.report = {
            "timestamp": datetime.now().isoformat(),
            "scores": {},
            "findings": [],
            "recommendations": []
        }
    
    def audit_originality(self) -> Tuple[float, List[str]]:
        """Check if project is original and not a copy"""
        score = 10.0
        findings = []
        
        # Check for common boilerplate
        readme = self.repo_path / "README.md"
        if readme.exists():
            content = readme.read_text().lower()
            
            # Check for AI-generated boilerplate
            boilerplate_phrases = [
                "in the ever-evolving landscape",
                "leveraging cutting-edge",
                "revolutionary solution",
                "seamlessly integrates"
            ]
            
            for phrase in boilerplate_phrases:
                if phrase in content:
                    score -= 0.5
                    findings.append(f"⚠️ Boilerplate detected: '{phrase}'")
        
        # Check code uniqueness
        main_files = list(self.repo_path.glob("backend/**/*.py"))
        if len(main_files) < 3:
            score -= 2
            findings.append("❌ Too few source files - may be incomplete")
        
        return max(0, score), findings
    
    def audit_functionality(self) -> Tuple[float, List[str]]:
        """Check if code actually works"""
        score = 10.0
        findings = []
        
        # Check Python syntax
        py_files = list(self.repo_path.glob("backend/**/*.py"))
        for f in py_files:
            try:
                result = subprocess.run(
                    ["python", "-m", "py_compile", str(f)],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                if result.returncode != 0:
                    score -= 1
                    findings.append(f"❌ Syntax error in {f.name}")
            except Exception as e:
                findings.append(f"⚠️ Could not check {f.name}: {e}")
        
        # Check for required files
        required = [
            "backend/main.py",
            "backend/requirements.txt",
            "deployment/Dockerfile"
        ]
        
        for req in required:
            if not (self.repo_path / req).exists():
                score -= 2
                findings.append(f"❌ Missing required file: {req}")
        
        return max(0, score), findings
    
    def audit_requirements(self) -> Tuple[float, Dict]:
        """Check hackathon requirement compliance"""
        score = 0.0
        checks = {
            "gemini_live_api": False,
            "voice_interaction": False,
            "screen_awareness": False,
            "interruption_detection": False,
            "cloud_deployment": False,
            "documentation": False
        }
        
        # Check Gemini Live API usage
        gemini_file = self.repo_path / "backend/services/gemini_live.py"
        if gemini_file.exists():
            content = gemini_file.read_text()
            checks["gemini_live_api"] = "LiveConnectConfig" in content or "live" in content.lower()
            checks["voice_interaction"] = "AUDIO" in content or "audio" in content.lower()
        
        # Check screen awareness
        vision_file = self.repo_path / "backend/services/vision_analyzer.py"
        checks["screen_awareness"] = vision_file.exists()
        
        # Check interruption detection
        interrupt_file = self.repo_path / "backend/services/interruption_detector.py"
        checks["interruption_detection"] = interrupt_file.exists()
        
        # Check deployment
        checks["cloud_deployment"] = (self.repo_path / "deployment/cloud-run.yaml").exists()
        
        # Check docs
        readme = self.repo_path / "README.md"
        checks["documentation"] = readme.exists() and readme.stat().st_size > 2000
        
        score = (sum(checks.values()) / len(checks)) * 10
        return score, checks
    
    def audit_completeness(self) -> Tuple[float, List[str]]:
        """Check if submission is complete"""
        score = 10.0
        findings = []
        
        # Check for TODO/FIXME comments
        all_files = list(self.repo_path.rglob("*.py")) + list(self.repo_path.rglob("*.js"))
        todos = 0
        for f in all_files:
            try:
                content = f.read_text()
                todos += content.count("TODO") + content.count("FIXME") + content.count("XXX")
            except:
                pass
        
        if todos > 5:
            score -= min(todos * 0.5, 5)
            findings.append(f"⚠️ {todos} TODO/FIXME items found")
        
        # Check test coverage
        test_files = list(self.repo_path.rglob("test_*.py")) + list(self.repo_path.rglob("*_test.py"))
        if len(test_files) == 0:
            score -= 2
            findings.append("❌ No test files found")
        
        return max(0, score), findings
    
    def generate_report(self) -> str:
        """Run all audits and generate report"""
        
        # Run all audits
        orig_score, orig_findings = self.audit_originality()
        func_score, func_findings = self.audit_functionality()
        req_score, req_checks = self.audit_requirements()
        comp_score, comp_findings = self.audit_completeness()
        
        self.report["scores"] = {
            "originality": orig_score,
            "functionality": func_score,
            "requirements": req_score,
            "completeness": comp_score,
            "overall": (orig_score + func_score + req_score + comp_score) / 4
        }
        
        self.report["findings"] = orig_findings + func_findings + comp_findings
        self.report["requirements"] = req_checks
        
        # Generate recommendations
        if self.report["scores"]["overall"] < 7:
            self.report["recommendations"].append("🔴 Critical: Submission needs significant work")
        elif self.report["scores"]["overall"] < 9:
            self.report["recommendations"].append("🟡 Good: Polish before final submission")
        else:
            self.report["recommendations"].append("🟢 Excellent: Ready for submission")
        
        if not req_checks["gemini_live_api"]:
            self.report["recommendations"].append("❌ Must use Gemini Live API - core requirement")
        
        if not req_checks["screen_awareness"]:
            self.report["recommendations"].append("❌ Must implement screen awareness - differentiating feature")
        
        # Format report
        report_lines = [
            "# Hackathon Submission Audit Report",
            f"**Generated**: {self.report['timestamp']}",
            "",
            "## Scores",
            "",
            "| Category | Score | Status |",
            "|----------|-------|--------|",
        ]
        
        for cat, score in self.report["scores"].items():
            if cat == "overall":
                report_lines.append(f"| **{cat.capitalize()}** | **{score:.1f}/10** | {'✅' if score >= 8 else '⚠️' if score >= 6 else '❌'} |")
            else:
                report_lines.append(f"| {cat.capitalize()} | {score:.1f}/10 | {'✅' if score >= 8 else '⚠️' if score >= 6 else '❌'} |")
        
        report_lines.extend([
            "",
            "## Requirements Check",
            "",
            "| Requirement | Status |",
            "|-------------|--------|",
        ])
        
        for req, status in req_checks.items():
            report_lines.append(f"| {req.replace('_', ' ').title()} | {'✅' if status else '❌'} |")
        
        if self.report["findings"]:
            report_lines.extend([
                "",
                "## Findings",
                "",
            ])
            for finding in self.report["findings"]:
                report_lines.append(f"- {finding}")
        
        report_lines.extend([
            "",
            "## Recommendations",
            "",
        ])
        for rec in self.report["recommendations"]:
            report_lines.append(f"- {rec}")
        
        return "\n".join(report_lines)
    
    def save_report(self, output_path: str = "AUDIT_REPORT.md"):
        """Save report to file"""
        report = self.generate_report()
        Path(output_path).write_text(report)
        print(f"Report saved to {output_path}")
        return report

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Audit hackathon submission")
    parser.add_argument("--path", default=".", help="Path to repository")
    parser.add_argument("--output", default="AUDIT_REPORT.md", help="Output file")
    parser.add_argument("--json", action="store_true", help="Output JSON")
    
    args = parser.parse_args()
    
    auditor = HackathonAuditor(args.path)
    
    if args.json:
        auditor.generate_report()
        print(json.dumps(auditor.report, indent=2))
    else:
        report = auditor.save_report(args.output)
        print(report)
    
    # Exit with error code if score is too low
    if auditor.report["scores"]["overall"] < 6:
        sys.exit(1)
