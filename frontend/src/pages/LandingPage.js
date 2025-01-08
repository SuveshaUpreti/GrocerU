import React from 'react';

const Landing = () => {    
    return (
        <div className="landing-container">
            <div className="landing-header"></div>
            <div className="landing-photo"><img src="/images/landingpage-produce.jpg"></img></div>
            <div className="landing-tagline"><h1>Your All-In-One Grocery Inventory System</h1></div>
            <div className="landing-features">
                <div className="landing-card">
                    <img src="/images/landing-clipboard.png"></img>
                    <p>Track your grocery inventory</p>
                </div>
                <div className="landing-card">
                    <img src="/images/landing-basket.png" className="basket"></img>
                    <p>Create interactive shopping lists</p>
                </div>
                <div className="landing-card">
                    <img src="/images/landing-cooking.png"></img>
                    <p>Generate recipes based on in-stock ingredients</p>
                </div>
            </div>
            <div className="landing-info-container">
                <div className="about-conatiner">
                    <div className="about-box">
                        <div className="about-text">
                            <h1>About</h1>
                            <p> Lorem ipsum dolor sit amet, consectetur<br />
                                adipiscing elit, sed do eiusmod tempo<br />
                                incididunt ut labore et dolore magna<br />
                                aliqua. Ut enim ad minim veniam, quis<br />
                                nostrud exercitation ullamco laboris nisi<br />
                                ut aliquip ex ea commodo consequat. Duis<br />
                                velit esse cillum dolore eu fugiat nulla<br />
                                pariatur. Excepteur sint occaecat cupidatat<br />
                                est laborum.</p>
                        </div>
                    </div>
                    <div className="about-photo">
                        <img src="/images/about-photo.jpg"></img>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Landing;

