# SafeIdea vetKey/NFT Design Prototype Project
## Milestone 2 & 3 Completion Report

### Project Overview
The SafeIdea project has successfully completed both Milestone 2 and Milestone 3 by forking Dfinity's official vetKeys repository (https://github.com/dfinity/vetkeys) and implementing critical enhancements for time-based access control, anonymous decryption, and comprehensive permission management. Our fork demonstrates proposed improvements that could be integrated back into the main Dfinity vetKeys toolkit.

### Milestone 2: Fork and Enhancement of Dfinity vetKeys
**Status: COMPLETED**
**Original Repository: https://github.com/dfinity/vetkeys**
**Our Fork: https://github.com/shipstone-labs/vetkd-devkit**

#### Deliverables Completed:

1. **Forked Dfinity vetKeys Repository**
   - Successfully forked the official Dfinity vetKeys repository
   - Maintained compatibility with existing vetKeys API while adding new features
   - Preserved all original functionality while extending capabilities

2. **Added Timed Decryption Support**
   - Enhanced the vetKey derivation system to support time-locked keys
   - Extended the AccessRights structure from `{ Read: null, ReadWrite: null, ReadWriteManage: null }` to `{ start: [bigint], end: [bigint], rights: { Read: null, ReadWrite: null, ReadWriteManage: null } }`
   - This allows keys to become available only within specified time windows
   - Integrated with IC's certified time to ensure tamper-proof temporal constraints

3. **Implemented Anonymous Decryption**
   - Extended the encryption framework to support public/anonymous access patterns
   - Utilized the standard ICP anonymous Principal as the principal meaning "Everyone"
   - This allows users to grant access to all users by adding the anonymous Principal to access rights
   - Enables use cases where content becomes publicly available after certain conditions

4. **Enhanced Permission Protection System**
   - Added role-based access control layer on top of existing vetKeys permissions
   - Implemented "user" and "manager" roles with different access levels
   - Protected permission queries so only managers can view other users' vetKey derivation permissions
   - Maintained backward compatibility with existing permission systems

5. **Added Comprehensive Audit Support**
   - Built audit logging system for all vetKey derivations and permission changes
   - Implemented immutable audit trail for establishing provenance
   - Added new canister methods for querying audit history
   - Created exportable audit reports for compliance requirements

#### Technical Modifications to Dfinity's Code:

```rust
// Extended AccessRights structure for timed access
pub type AccessRights = {
    start: [bigint];  // Optional start time
    end: [bigint];    // Optional end time
    rights: {
        Read: null;
        ReadWrite: null;
        ReadWriteManage: null;
    };
};

// Example of using anonymous Principal for public access
let anonymous_principal = Principal::anonymous();
// Grant public access by adding anonymous_principal to access list
```

### Milestone 3: Demo Deployment Showcasing Enhanced Features
**Status: COMPLETED**

#### Deliverables Completed:

1. **Time Selection Menu Implementation**
   - Built user interface demonstrating the new timed decryption features
   - Created intuitive date/time picker for setting key availability windows
   - Implemented "Always Available" option maintaining compatibility with original vetKeys
   - Shows clear visual feedback for time-locked keys

2. **User ID and Anonymous Sharing Demo**
   - Developed interface showcasing the new anonymous decryption capabilities
   - Demonstrates transition from user-specific to public access based on time
   - Visual indicators showing current access state (private/public)
   - Compatible with existing Internet Identity integration

3. **Permission System Demonstration**
   - Live demo showing permission denial for non-managers accessing others' key permissions
   - Role switching interface to demonstrate manager capabilities
   - Shows how our enhancements layer on top of existing vetKeys permissions
   - Maintains security while adding granular control

4. **Audit Trail and Provenance Interface**
   - Manager dashboard displaying comprehensive audit logs
   - Demonstrates provenance tracking for all key operations
   - Export functionality for compliance reporting
   - Shows how audit system integrates without impacting performance

5. **Experience Report and Recommendations**

#### Key Findings from Our Implementation:

**Challenges Encountered:**
1. **Time Synchronization**: The IC's time certification required careful handling to prevent drift
2. **Backward Compatibility**: Ensuring new features didn't break existing vetKeys implementations
3. **State Migration**: Designing upgrade paths for canisters using standard vetKeys
4. **Performance Impact**: Minimizing overhead from audit logging and time checks

**Repo Notes:**
- There is a deploy-local script and the Makefile assumes local deploy as well. => Use manual deployment and canister call to inject test container.
- Using dfx deploy uses the standard deployment without a custom build command to inject the canister ids depending on network setup => Changed vite setup as in #3 and manually created a .env with the production canister IDs. (current I checked in canister_ids.json which is not ideal, but otherwise easy to lose across my different dev boxes.)
- The vite setup is assuming that the .env is read. Although process.env is correctly detected, a manual call to `import { config } from "dotenv"; config()` is require to read .env at this point. (As mentioned in #2)
- The rust canister has a feature called expose-testing-api. It is removed during the normal dfx deploy, because dfx doesn't allow custom build commands. => Change the cargo setup to add expose-testing-api as a default build feature.
- I did notice that the canister call inside of the Makefile looks like it has additional quotes in it, but since I was not running them using "make" it's possibly a gnumake quotism.

### Demonstration Site Features:

Our demo deployment showcases how these enhancements work in practice:
- **Password Manager Example**: Modified to support time-locked passwords
- **Document Sharing Demo**: Shows transition from private to public access
- **Audit Dashboard**: Live view of all key operations with filtering

### Benefits of Our Enhancements:

1. **Use Case Expansion**: Enables time-locked content, embargoed information, scheduled reveals
2. **Compliance Ready**: Audit trails satisfy regulatory requirements
3. **Improved Security**: Granular permissions prevent unauthorized access
4. **Developer Friendly**: Maintains simple API while adding powerful features

### Conclusion:

The SafeIdea project has successfully demonstrated useful enhancements to Dfinity's vetKeys toolkit through our fork at https://github.com/shipstone-labs/vetkd-devkit. Our additions of timed decryption, anonymous access, enhanced permissions, and audit support significantly expand the practical applications of vetKeys while maintaining full backward compatibility.

We believe these features would be useful additions to the official vetKeys repository and have implemented them in a way that could be easily merged upstream. The demo site provides concrete examples of how these enhancements benefit real-world applications.

Our work shows that vetKeys can evolve to support more complex security scenarios while remaining developer-friendly and maintaining the core principles of threshold cryptography that make the Internet Computer unique.

The additional attached document is a short description suggesting additional improvements to the SDK that would practically extend the use cases for vetKeys to perform a variety of cross-blockchain operations with encrypted digital assets.


---
*Submitted by: SafeIdea Team*  
*Date: June 1, 2025*  
*Original Repository: https://github.com/dfinity/vetkeys*  
*Our Fork: https://github.com/shipstone-labs/vetkd-devkit*
