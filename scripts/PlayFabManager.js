
import EventEmitter from './EventEmitter.js';

class PlayFabManager extends EventEmitter {
    constructor() {
        super();
        this.titleId = "123FF2"; 
        if (this.titleId === "123FF2") {
            console.warn("PlayFab Title ID is not set. Please replace '123FF2' in PlayFabManager.js with your actual Title ID.");
        }
        PlayFab.settings.titleId = this.titleId;
    }

    login(email, password) {
        const loginRequest = {
            Email: email,
            Password: password,
            TitleId: this.titleId,
            InfoRequestParameters: {
                GetUserAccountInfo: true
            }
        };

        PlayFabClientSDK.LoginWithEmailAddress(loginRequest, (result, error) => {
            if (result) {
                this.emit('loginSuccess', result.data);
            } else {
                this.emit('loginFailure', this.handleError(error));
            }
        });
    }

    register(email, password) {
        const registerRequest = {
            Email: email,
            Password: password,
            Username: email.split('@')[0], // Create a username from the email
            TitleId: this.titleId,
            DisplayName: email.split('@')[0]
        };

        PlayFabClientSDK.RegisterPlayFabUser(registerRequest, (result, error) => {
            if (result) {
                this.emit('registerSuccess', result.data);
            } else {
                this.emit('registerFailure', this.handleError(error));
            }
        });
    }

    forgotPassword(email) {
        const request = {
            Email: email,
            TitleId: this.titleId
        };
        PlayFabClientSDK.SendAccountRecoveryEmail(request, (result, error) => {
            if (result) {
                this.emit('forgotPasswordSuccess', 'Password recovery email sent. Please check your inbox.');
            } else {
                this.emit('forgotPasswordFailure', this.handleError(error));
            }
        });
    }

    handleError(error) {
        let errorMessage = "An unknown error occurred.";
        if (error) {
            if (error.errorMessage) {
                errorMessage = error.errorMessage;
            } else if (error.errorDetails) {
                const details = Object.values(error.errorDetails).flat();
                if (details.length > 0) {
                    errorMessage = details.join(' ');
                }
            }
        }
        console.error("PlayFab Error:", error);
        return errorMessage;
    }
}

export const playFabManager = new PlayFabManager();
