var scenarioConfig = {};

scenarioConfig.config = (host, port) =>
{
    return {
        "label": `Network - tx collisions`,
        "url": `${host}:${port}/network/tx-collisions/index.html`,
        "referenceUrl": ``,
        "readyEvent": ``,
        "readySelector": ``,
        "delay": 0,
        "hideSelectors": [],
        "removeSelectors": [],
        "hoverSelector": ``,
        "clickSelector": ``,
        "postInteractionWait": 0,
        "selectors": [ ],
        "selectorExpansion": true,
        "expect": 0,
        "misMatchThreshold" : 0.1,
        "requireSameDimensions": true
    };
};

module.exports = scenarioConfig;
