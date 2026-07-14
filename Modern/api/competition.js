const express = require("express");
const router = express.Router();

const competitionService = require("../services/competition.service");


router.post("/save", async (req, res)=>{

    try {

        const result =
            await competitionService.saveSchedule(req.body);

        res.json(result);

    } catch(err){

        console.error(err);

        res.status(500)
        .json({
            error:"保存赛程失败"
        });

    }

});

router.get("/schedule", async(req, res)=>{

    try {

        const result =
            await competitionService.getSchedule(1);

        res.json(result);

    }catch(err){

        console.error(err);

        res.status(500)
        .json({
            error:"获取赛程失败"
        });

    }

});

router.put("/match/:id", async(req, res)=>{

try {

    const result =
        await competitionService.updateMatch(
            req.params.id,
            req.body.score1,
            req.body.score2,
            req.body.status
        );

    res.json(result);

}catch(err){

    console.error(err);

    res.status(500)
    .json({
        error:"更新失败"
    });

}

});

router.delete("/reset", async(req, res)=>{

    try{

        const result =
            await competitionService.resetCompetition();

        res.json(result);

    }catch(err){

        console.error(err);

        res.status(500)
        .json({
            error:"重置失败"
        });

    }

});

router.post("/generate", async(req,res)=>{

    try{

        const result =
            await competitionService.generateCompetition(
                req.body
            );

        res.json(result);

    }catch(err){

        console.error(err);

        res.status(500)
        .json({
            error:"生成失败"
        });

    }

});

module.exports = router;